from __future__ import annotations
import uuid
from decimal import Decimal
from sqlmodel import Session

from ..domain.entities import SimulationRecord
from ..domain.scoring import ScoringInputs, get_strategy
from .dtos import SimulationRequestDTO, SimulationResponseDTO


class SimulationService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def calculate(self, dto: SimulationRequestDTO, user_id: uuid.UUID | None = None) -> SimulationResponseDTO:
        strategy = get_strategy(dto.sector)

        weights = self._load_weights(dto.sector)

        inputs = ScoringInputs(
            monto_inversion_usd=dto.monto_inversion_usd,
            empleo_directo=dto.empleo_directo,
            porcentaje_cl=dto.porcentaje_cl,
            tiempo_instalacion_meses=dto.tiempo_instalacion_meses,
            pais_origen=dto.pais_origen,
            exportacion_pct=dto.exportacion_pct,
            variables_sector=dto.variables_sector,
        )

        result = strategy.score(inputs, weights)

        record = self.get_by_session(dto.session_id)
        if record is None:
            record = SimulationRecord(session_id=dto.session_id)
            self._session.add(record)

        record.user_id = user_id or record.user_id
        record.sector = dto.sector
        record.clasificacion = result.clasificacion
        record.monto_inversion_usd = dto.monto_inversion_usd
        record.empleo_directo = dto.empleo_directo
        record.empleo_indirecto = dto.empleo_indirecto
        record.porcentaje_cl = dto.porcentaje_cl
        record.tiempo_instalacion_meses = dto.tiempo_instalacion_meses
        record.pais_origen = dto.pais_origen
        record.exportacion_pct = dto.exportacion_pct
        record.variables_sector = dto.variables_sector
        record.v_base = result.v_base
        record.delta_cl = result.delta_cl
        record.delta_sector = result.delta_sector
        record.v_final = result.v_final
        record.beneficio_cl_activo = result.beneficio_cl_activo
        record.proyeccion_fiscal = result.proyeccion_fiscal
        record.alertas = result.alertas
        record.recomendaciones_agente = result.recomendaciones

        self._session.commit()
        self._session.refresh(record)

        return self._to_response_dto(record, result)

    def record_to_response(self, record: SimulationRecord) -> SimulationResponseDTO:
        """Reconstruye DTO (incl. explicación) desde fila persistida."""
        strategy = get_strategy(record.sector)
        inputs = ScoringInputs(
            monto_inversion_usd=record.monto_inversion_usd,
            empleo_directo=record.empleo_directo,
            porcentaje_cl=record.porcentaje_cl,
            tiempo_instalacion_meses=record.tiempo_instalacion_meses,
            pais_origen=record.pais_origen,
            exportacion_pct=record.exportacion_pct,
            variables_sector=record.variables_sector or {},
        )
        result = strategy.score(inputs, self._load_weights(record.sector))
        return self._to_response_dto(record, result)

    def _to_response_dto(
        self, record: SimulationRecord, result
    ) -> SimulationResponseDTO:
        fiscal = record.proyeccion_fiscal or result.proyeccion_fiscal
        if "nota_beneficios" not in fiscal:
            fiscal = {**fiscal, **result.proyeccion_fiscal}
        return SimulationResponseDTO(
            id=record.id,
            session_id=record.session_id,
            sector=record.sector,
            clasificacion=record.clasificacion,
            v_base=float(record.v_base),
            delta_cl=float(record.delta_cl),
            delta_sector=float(record.delta_sector),
            v_final=float(record.v_final),
            beneficio_cl_activo=record.beneficio_cl_activo,
            razon_clasificacion=result.razon_clasificacion,
            factores_elegibilidad=result.factores_elegibilidad,
            proyeccion_fiscal=fiscal,
            alertas=record.alertas or result.alertas,
            recomendaciones_agente=record.recomendaciones_agente or result.recomendaciones,
            created_at=record.created_at.isoformat(),
        )

    def get_by_session(self, session_id: uuid.UUID) -> SimulationRecord | None:
        from sqlmodel import select
        return self._session.exec(
            select(SimulationRecord).where(SimulationRecord.session_id == session_id)
        ).first()

    def _load_weights(self, sector: str) -> dict:
        """Carga los pesos del scoring desde weight_configs. Usa defaults si no hay config activa."""
        from ..domain.entities import WeightConfig
        from sqlmodel import select

        config = self._session.exec(
            select(WeightConfig)
            .where(WeightConfig.sector == sector, WeightConfig.activo == True)
        ).first()

        if config:
            return config.weights

        # Pesos por defecto del spec02
        defaults = {
            "manufactura": {"w1": 0.45, "w2": 0.25, "w3": 0.30, "w5": 0.15, "w6": 0.10, "w7": 0.10},
            "ckd":         {"w1": 0.45, "w2": 0.25, "w3": 0.30, "w5": 0.15, "w6": 0.12, "w7": 0.08},
            "tech":        {"w1": 0.45, "w2": 0.25, "w3": 0.30, "w5": 0.18, "w6": 0.14, "w7": 0.08},
        }
        return defaults.get(sector, defaults["manufactura"])
