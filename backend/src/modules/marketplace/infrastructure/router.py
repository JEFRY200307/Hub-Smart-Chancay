from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List
from src.shared.infrastructure.database import get_session
from src.modules.zeep_ingestion.domain.entities import Company
from src.modules.identity.infrastructure.auth_dependency import get_current_user
from src.modules.identity.domain.entities import User
from ..application.dtos import ZEEPOpportunityDTO, OperatorDTO

router = APIRouter(prefix="/api/v1/marketplace", tags=["Marketplace"])

@router.get("/recommendations", response_model=List[OperatorDTO])
async def get_market_recommendations(
    sector: str = "Logística",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Busca empresas validadas en la zona de influencia por sector macro.
    """
    statement = select(Company).where(Company.sector_macro == sector).limit(10)
    results = session.exec(statement).all()
    
    # Transformación de Company (Entity) a OperatorDTO
    operators = []
    for c in results:
        operators.append(OperatorDTO(
            id=str(c.id),
            name=c.razon_social,
            tier="Strategic Partner",
            description=f"Operador validado por SUNAT en {c.ubigeo}",
            services=c.capacidad_operativa.get("servicios_clave", ["Consultoría General"]),
            rating=4.5,
            verified=True if c.estado_contribuyente == "ACTIVO" else False
        ))
    
    # Fallback con mock si no hay datos en la DB aún
    if not operators:
        return [
            OperatorDTO(
                id="mock-1",
                name="LogiChancay S.A.C.",
                tier="Tier 1 Partner",
                description="Especialistas en logística de última milla.",
                services=["DTA", "Almacenaje"],
                rating=4.9,
                verified=True
            )
        ]
        
    return operators

@router.get("/opportunities", response_model=List[ZEEPOpportunityDTO])
async def summarize_opportunities(
    current_user: User = Depends(get_current_user)
):
    # Este se mantiene como mock o se puede conectar a StructuredOpportunity de zeep_ingestion
    return [
        ZEEPOpportunityDTO(
            id="opp-1",
            title="Maritime Cold Chain Expansion",
            category="Operational",
            match_score=98,
            description="Seeking specialized Peruvian partners for integrated refrigerated transport.",
            tags=["Refrigerated Logistics", "Chancay Hub"],
            company_name="Global Logistics Corp",
            posted_ago="2h ago"
        )
    ]
