from __future__ import annotations
from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlmodel import Session, select

from src.shared.infrastructure.database import get_session
from src.shared.domain.exceptions import DomainException
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User

from ..application.dtos import ETLIngestRequestDTO, ETLReportDTO, ETLStatusDTO
from ..application.etl_service import ETLPadronRucService
from ..domain.entities import PadronRucRecord

router = APIRouter(prefix="/api/v1/analytics", tags=["ETL PadronRUC"])


@router.post(
    "/padron/ingest",
    response_model=ETLReportDTO,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_padron_ingest(
    payload: ETLIngestRequestDTO,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Dispara la ingesta del Padrón RUC SUNAT (solo admin).
    La ejecución ocurre en background; la respuesta es inmediata con el último reporte.
    """
    if current_user.role != "admin":
        raise DomainException(
            title="Forbidden",
            detail="Solo administradores pueden iniciar la ingesta del Padrón RUC.",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    def run_etl(url: str | None) -> None:
        from src.shared.infrastructure.database import engine
        with Session(engine) as bg_session:
            svc = ETLPadronRucService(bg_session)
            svc.run(url)

    background_tasks.add_task(run_etl, payload.filepath or payload.url_archivo)

    # Devuelve el estado de la última ejecución conocida
    count = session.exec(select(PadronRucRecord)).first()
    return ETLReportDTO(
        total_staging=0,
        total_insertados=0,
        total_actualizados=0,
        total_rechazados=0,
        duracion_segundos=0,
        estado="en_proceso",
        fecha_descarga=__import__("datetime").date.today(),
    )


@router.get("/padron/status", response_model=ETLStatusDTO)
async def get_padron_status(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    """Estado del staging y última sincronización del Padrón RUC."""
    from src.modules.zeep_ingestion.domain.entities import Company
    from sqlmodel import func

    total_staging = session.exec(
        select(func.count()).select_from(PadronRucRecord)
    ).one()

    total_active = session.exec(
        select(func.count()).select_from(Company)
        .where(Company.estado_contribuyente == "ACTIVO")
    ).one()

    latest = session.exec(
        select(PadronRucRecord.descarga_fecha)
        .order_by(PadronRucRecord.descarga_fecha.desc())
    ).first()

    return ETLStatusDTO(
        ultima_ejecucion=str(latest) if latest else None,
        estado="completado" if total_staging > 0 else "sin_datos",
        total_staging=total_staging,
        total_companies_activas=total_active,
    )
