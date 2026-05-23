from __future__ import annotations
from datetime import date
from typing import Optional
from pydantic import BaseModel


class ETLIngestRequestDTO(BaseModel):
    """Solicitud de ingesta manual del Padrón RUC (endpoint admin)."""
    filepath: Optional[str] = None          # Ruta local del TXT PadronRUC
    url_archivo: Optional[str] = None       # Alias / URL remota
    force: bool = False
    forzar_descarga: bool = False           # compatibilidad interna


class ETLReportDTO(BaseModel):
    """Resultado devuelto al final de la ejecución ETL."""
    total_staging: int
    total_insertados: int
    total_actualizados: int
    total_rechazados: int
    duracion_segundos: float
    estado: str                             # completado | fallido | parcial
    fecha_descarga: date
    error_detalle: Optional[str] = None


class ETLStatusDTO(BaseModel):
    """Estado de la última ejecución del ETL."""
    ultima_ejecucion: Optional[str]         # ISO 8601
    estado: Optional[str]
    total_staging: Optional[int]
    total_companies_activas: int
