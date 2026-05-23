from __future__ import annotations
import io
import time
import logging
import zipfile
import httpx
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import Session, select, text

from ..domain.entities import PadronRucRecord
from .dtos import ETLReportDTO

logger = logging.getLogger(__name__)

# Padrón RUC SUNAT — URL pública de descarga mensual
PADRON_RUC_URL = "https://www.sunat.gob.pe/descargaPRR/mrc14332DDATdd.zip"

# CIIU → sector_interno (spec07)
CIIU_SECTOR_MAP = {
    range(1510, 3400): "manufactura",
    range(2910, 3600): "ckd",
    range(6201, 6210): "tech",
    range(4900, 5400): "logistica",
    range(4100, 4400): "construccion",
}


def _ciiu_to_sector(ciiu: str | None) -> str | None:
    if not ciiu:
        return None
    try:
        code = int(ciiu[:4])
        for r, sector in CIIU_SECTOR_MAP.items():
            if code in r:
                return sector
    except (ValueError, TypeError):
        pass
    return "otros"


class ETLPadronRucService:
    BATCH_SIZE = 1_000

    def __init__(self, session: Session) -> None:
        self._session = session

    def run(self, url: str | None = None) -> ETLReportDTO:
        inicio = time.time()
        fecha_descarga = date.today()

        try:
            # Paso 1: Descargar y descomprimir
            raw_lines = self._download(url or PADRON_RUC_URL)

            # Paso 2: Truncar staging y cargar
            total_staging = self._load_staging(raw_lines, fecha_descarga)

            # Paso 3: Upsert en companies (respetando campos SUNARP)
            insertados, actualizados, rechazados = self._upsert_companies()

            # Paso 4: Cerrar staging (no truncar; se mantiene para auditoría hasta próxima ejecución)
            duracion = time.time() - inicio
            return ETLReportDTO(
                total_staging=total_staging,
                total_insertados=insertados,
                total_actualizados=actualizados,
                total_rechazados=rechazados,
                duracion_segundos=round(duracion, 2),
                estado="completado",
                fecha_descarga=fecha_descarga,
            )

        except Exception as exc:
            duracion = time.time() - inicio
            logger.error("ETL PadronRUC fallido: %s", exc, exc_info=True)
            return ETLReportDTO(
                total_staging=0,
                total_insertados=0,
                total_actualizados=0,
                total_rechazados=0,
                duracion_segundos=round(duracion, 2),
                estado="fallido",
                fecha_descarga=date.today(),
                error_detalle=str(exc),
            )

    # ── Pasos del ETL ────────────────────────────────────────────────────────

    def _download(self, url: str) -> list[str]:
        response = httpx.get(url, timeout=120, follow_redirects=True)
        response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            txt_name = next(n for n in zf.namelist() if n.lower().endswith(".txt"))
            raw = zf.read(txt_name).decode("latin-1")

        return raw.splitlines()

    def _load_staging(self, lines: list[str], fecha_descarga: date) -> int:
        # Truncar staging antes de cargar nueva descarga
        self._session.exec(text("TRUNCATE TABLE padron_ruc_staging"))  # type: ignore[arg-type]
        self._session.commit()

        count = 0
        batch: list[PadronRucRecord] = []

        for line in lines:
            parts = line.split("|")
            if len(parts) < 6:
                continue
            ruc = parts[0].strip()
            if len(ruc) != 11:
                continue

            record = PadronRucRecord(
                ruc=ruc,
                razon_social=(parts[1].strip() or "")[:500],
                estado_contribuyente=(parts[2].strip() or "BAJA")[:30],
                condicion_contribuyente=(parts[3].strip() or "NO HABIDO")[:20],
                tipo_contribuyente=parts[4].strip()[:50] if len(parts) > 4 else None,
                ciiu_principal=parts[5].strip()[:10] if len(parts) > 5 else None,
                ubigeo=parts[6].strip()[:6] if len(parts) > 6 else None,
                descarga_fecha=fecha_descarga,
            )
            batch.append(record)
            count += 1

            if len(batch) >= self.BATCH_SIZE:
                self._session.add_all(batch)
                self._session.commit()
                batch.clear()

        if batch:
            self._session.add_all(batch)
            self._session.commit()

        return count

    def _upsert_companies(self) -> tuple[int, int, int]:
        """
        Para cada registro en staging con estado ACTIVO o SUSPENDIDO, hace upsert en companies.
        NUNCA sobreescribe: trust_score, directorio, cargas (campos SUNARP).
        """
        insertados = actualizados = rechazados = 0

        staging_records = self._session.exec(
            select(PadronRucRecord)
            .where(PadronRucRecord.estado_contribuyente.in_(["ACTIVO", "SUSPENDIDO"]))
        ).all()

        # Procesar en lotes
        for i in range(0, len(staging_records), self.BATCH_SIZE):
            batch = staging_records[i : i + self.BATCH_SIZE]
            try:
                ins, act = self._upsert_batch(batch)
                insertados += ins
                actualizados += act
                self._session.commit()
            except Exception as exc:
                logger.warning("Batch %d fallido: %s", i // self.BATCH_SIZE, exc)
                self._session.rollback()
                rechazados += len(batch)

        return insertados, actualizados, rechazados

    def _upsert_batch(self, batch: list[PadronRucRecord]) -> tuple[int, int]:
        from src.modules.zeep_ingestion.domain.entities import Company

        insertados = actualizados = 0
        rucs = [r.ruc for r in batch]
        existing = {
            c.ruc: c
            for c in self._session.exec(select(Company).where(Company.ruc.in_(rucs))).all()
        }

        for record in batch:
            sector = _ciiu_to_sector(record.ciiu_principal)
            if record.ruc in existing:
                company = existing[record.ruc]
                # Solo actualizar campos PadronRUC; nunca tocar trust_score, directorio, cargas
                company.estado_contribuyente = record.estado_contribuyente
                company.condicion_contribuyente = record.condicion_contribuyente
                company.ciiu_principal = record.ciiu_principal or company.ciiu_principal
                company.sector_interno = sector or company.sector_interno
                company.last_padron_sync = record.descarga_fecha
                company.updated_at = datetime.utcnow()
                self._session.add(company)
                actualizados += 1
            else:
                new_company = Company(
                    ruc=record.ruc,
                    razon_social=record.razon_social,
                    tipo_persona="JURIDICA",
                    estado_sunarp="ACTIVA",
                    estado_contribuyente=record.estado_contribuyente,
                    condicion_contribuyente=record.condicion_contribuyente,
                    ciiu_principal=record.ciiu_principal,
                    ubigeo=record.ubigeo,
                    sector_interno=sector,
                    fuente_principal="padron_ruc",
                    last_padron_sync=record.descarga_fecha,
                )
                self._session.add(new_company)
                insertados += 1

        return insertados, actualizados
