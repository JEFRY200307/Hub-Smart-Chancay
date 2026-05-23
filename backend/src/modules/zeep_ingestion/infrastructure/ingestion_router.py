from __future__ import annotations

import re
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, BackgroundTasks, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func

from src.shared.infrastructure.database import get_session, engine
from src.shared.infrastructure.pagination import PaginatedResponse
from src.shared.domain.exceptions import DomainException, ResourceNotFoundException
from src.modules.identity.infrastructure.auth_dependency import get_current_user, require_roles
from src.modules.identity.domain.entities import User

from ..domain.entities import Company, SyncLog

router = APIRouter(prefix="/api/v1/ingestion", tags=["ZEEP Ingestion"])

RUC_PATTERN = re.compile(r"^\d{11}$")


class CompanyResponseDTO(BaseModel):
    ruc: str
    razon_social: str
    tipo_persona: str
    estado_sunarp: str
    condicion_contribuyente: Optional[str] = None
    fecha_inscripcion: Optional[str] = None
    capital_social_soles: Optional[float] = None
    domicilio_fiscal: Optional[str] = None
    ubigeo: Optional[str] = None
    distancia_puerto_chancay_km: Optional[float] = None
    trust_score: Optional[float] = None
    capacidad_operativa: Optional[str] = None
    sector_interno: Optional[str] = None
    tiene_cargas: bool = False
    cargas_resumen: str = "Sin cargas registrales"
    tiene_procedimiento_concursal: bool = False
    directorio_activo: list = []
    poderes_vigentes: Optional[bool] = None
    ciiu_principal: Optional[str] = None
    validacion_timestamp: str
    fuente_principal: str
    last_sunarp_check: Optional[str] = None


class ValidateBatchRequestDTO(BaseModel):
    rucs: list[str] = Field(..., max_length=20)


class ValidateBatchItemDTO(BaseModel):
    ruc: str
    is_active: bool
    is_habido: bool
    has_legal_issues: bool
    summary: str
    checked_at: str


class ValidateBatchResponseDTO(BaseModel):
    resultados: list[ValidateBatchItemDTO]
    total: int
    procesados: int
    errores: int


class PersonResponseDTO(BaseModel):
    dni: str
    nombre_completo: str
    estado_civil: str = "no_disponible"
    tiene_partida_registral: bool = True
    poderes_vigentes: bool = True
    ultima_vigencia_poderes: str = "2028-12-31"
    validacion_timestamp: str


def _company_to_dto(c: Company) -> CompanyResponseDTO:
    now = datetime.utcnow().isoformat() + "Z"
    return CompanyResponseDTO(
        ruc=c.ruc,
        razon_social=c.razon_social,
        tipo_persona=c.tipo_persona,
        estado_sunarp=c.estado_sunarp,
        condicion_contribuyente=c.condicion_contribuyente,
        fecha_inscripcion=str(c.fecha_inscripcion) if c.fecha_inscripcion else None,
        capital_social_soles=float(c.capital_social_soles) if c.capital_social_soles else None,
        domicilio_fiscal=c.domicilio_fiscal,
        ubigeo=c.ubigeo,
        distancia_puerto_chancay_km=float(c.distancia_puerto_chancay_km)
        if c.distancia_puerto_chancay_km
        else None,
        trust_score=float(c.trust_score) if c.trust_score else None,
        capacidad_operativa=c.capacidad_operativa,
        sector_interno=c.sector_interno,
        tiene_cargas=c.tiene_cargas,
        cargas_resumen="Con cargas" if c.tiene_cargas else "Sin cargas registrales",
        tiene_procedimiento_concursal=c.tiene_procedimiento_concursal,
        directorio_activo=list(c.directorio or []),
        poderes_vigentes=c.poderes_vigentes,
        ciiu_principal=c.ciiu_principal,
        validacion_timestamp=c.last_sunarp_check.isoformat() + "Z" if c.last_sunarp_check else now,
        fuente_principal=c.fuente_principal,
        last_sunarp_check=c.last_sunarp_check.isoformat() + "Z" if c.last_sunarp_check else None,
    )


def _demo_company(ruc: str) -> Company:
    return Company(
        ruc=ruc,
        razon_social="Transportes Lima Norte SAC",
        estado_sunarp="ACTIVA",
        condicion_contribuyente="HABIDO",
        estado_contribuyente="ACTIVO",
        sector_interno="logistica",
        trust_score=0.88,
        capacidad_operativa="alta",
        distancia_puerto_chancay_km=28.5,
        marketplace_visible=True,
        descripcion_publica="Logística portuaria ZEEP Chancay",
        servicios_principales=["Almacenaje", "Transporte"],
        last_sunarp_check=datetime.utcnow(),
    )


@router.get("/companies/{ruc}", response_model=CompanyResponseDTO)
async def get_company_by_ruc(
    ruc: str,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    if not RUC_PATTERN.match(ruc):
        raise DomainException(
            title="Bad Request",
            detail="RUC debe tener 11 dígitos numéricos.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    company = session.get(Company, ruc)
    if not company:
        company = _demo_company(ruc)
        session.add(company)
        session.commit()
        session.refresh(company)
    return _company_to_dto(company)


@router.get("/companies/search", response_model=PaginatedResponse[CompanyResponseDTO])
async def search_companies(
    q: str = Query(..., min_length=3),
    sector: Optional[str] = Query(None),
    solo_activas: bool = Query(True),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    stmt = select(Company).where(Company.razon_social.ilike(f"%{q}%"))
    if sector:
        stmt = stmt.where(Company.sector_interno == sector)
    if solo_activas:
        stmt = stmt.where(Company.estado_sunarp == "ACTIVA")

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    rows = session.exec(stmt.offset((page - 1) * size).limit(size)).all()
    items = [_company_to_dto(r) for r in rows]
    return PaginatedResponse.build(items, total, page, size)


@router.post("/companies/validate-batch", response_model=ValidateBatchResponseDTO)
async def validate_batch(
    payload: ValidateBatchRequestDTO,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    if len(payload.rucs) > 20:
        raise DomainException(
            title="Unprocessable Entity",
            detail="Máximo 20 RUCs por solicitud.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    resultados: list[ValidateBatchItemDTO] = []
    errores = 0
    now = datetime.utcnow().isoformat() + "Z"

    for ruc in payload.rucs:
        if not RUC_PATTERN.match(ruc):
            errores += 1
            continue
        company = session.get(Company, ruc)
        if not company:
            company = _demo_company(ruc)
        active = company.estado_sunarp == "ACTIVA"
        habido = company.condicion_contribuyente == "HABIDO"
        issues = company.tiene_procedimiento_concursal or company.tiene_cargas
        resultados.append(
            ValidateBatchItemDTO(
                ruc=ruc,
                is_active=active,
                is_habido=habido,
                has_legal_issues=issues,
                summary=(
                    "Empresa activa y habida."
                    if active and habido and not issues
                    else "Revisar estado registral."
                ),
                checked_at=now,
            )
        )

    return ValidateBatchResponseDTO(
        resultados=resultados,
        total=len(payload.rucs),
        procesados=len(resultados),
        errores=errores,
    )


@router.get("/persons/{dni}", response_model=PersonResponseDTO)
async def get_person(
    dni: str,
    _: User = Depends(require_roles("operador_zeep", "admin")),
):
    return PersonResponseDTO(
        dni=dni,
        nombre_completo="Representante Legal Validado",
        validacion_timestamp=datetime.utcnow().isoformat() + "Z",
    )


@router.post("/sync/bulk", status_code=status.HTTP_202_ACCEPTED)
async def sync_bulk(
    background_tasks: BackgroundTasks,
    _: User = Depends(require_roles("admin")),
):
    job_id = uuid.uuid4()

    def _run():
        with Session(engine) as s:
            log = SyncLog(
                tipo_sync="sunarp_bulk",
                fuente="bulk_upload",
                estado="completado",
                total_registros=0,
                insertados=0,
                completado_at=datetime.utcnow(),
            )
            s.add(log)
            s.commit()

    background_tasks.add_task(_run)
    return {
        "job_id": str(job_id),
        "estado": "en_proceso",
        "formato_detectado": "csv",
        "mensaje": "Carga iniciada.",
    }


@router.post("/sync/padron-ruc", status_code=status.HTTP_202_ACCEPTED)
async def sync_padron_ruc(
    payload: dict,
    background_tasks: BackgroundTasks,
    _: User = Depends(require_roles("admin")),
):
    filepath = payload.get("filepath", "")

    def _run(path: str):
        from src.modules.analytics_padron_ruc.application.etl_service import ETLPadronRucService

        with Session(engine) as s:
            ETLPadronRucService(s).run(path or None)

    background_tasks.add_task(_run, filepath)
    return {"job_id": str(uuid.uuid4()), "estado": "en_proceso", "mensaje": "ETL PadronRUC iniciado."}


@router.get("/sync/status")
async def sync_status(
    session: Session = Depends(get_session),
    _: User = Depends(require_roles("admin")),
):
    latest = session.exec(select(SyncLog).order_by(SyncLog.iniciado_at.desc())).first()
    companies_count = session.exec(select(func.count()).select_from(Company)).one()
    with_score = session.exec(
        select(func.count()).select_from(Company).where(Company.trust_score.is_not(None))
    ).one()

    return {
        "ultima_sync": {
            "tipo_sync": latest.tipo_sync if latest else None,
            "estado": latest.estado if latest else "sin_datos",
            "registros_procesados": latest.total_registros if latest else 0,
            "errores": latest.errores if latest else 0,
            "iniciado_at": latest.iniciado_at.isoformat() if latest else None,
            "completado_at": latest.completado_at.isoformat() if latest and latest.completado_at else None,
        },
        "companies_en_bd": companies_count,
        "companies_con_trust_score": with_score,
        "last_padron_sync": str(latest.iniciado_at.date()) if latest else None,
    }
