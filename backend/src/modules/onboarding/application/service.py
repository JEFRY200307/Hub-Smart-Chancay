from typing import Any
from sqlmodel import Session
from ..domain.entities import OnboardingProfile
from ..application.dtos import ProfileSubmitDTO

class OnboardingService:
    def __init__(self, session: Session):
        self.session = session
        
    def calculate_and_save_profile(self, payload: ProfileSubmitDTO, user_id: Any = None) -> OnboardingProfile:
        # Lógica de simulación de "Score de Elegibilidad"
        # En una versión real, esto consultaría un modelo de ML o una matriz legal compleja.
        
        score = 85 # Base
        if payload.investment_usd > 1000000:
            score += 5
        if payload.sector in ["Tecnología & I+D", "Manufactura"]:
            score += 4
        
        # Beneficios ZEEP (Simplificado según leyes peruanas de ZEE)
        exemption_years = 10 if score >= 80 else 0
        tariff_savings = 15.0 if payload.sector == "Logística" else 10.0
        
        # Match Territorial
        ideal_lot = "Lote Industrial Norte - Sector 4"
        if "Agro" in payload.sector:
            ideal_lot = "Zona de Procesamiento Agrícola B"
            
        profile = OnboardingProfile(
            sector=payload.sector,
            investment_usd=payload.investment_usd,
            required_sqm=payload.required_sqm,
            capital_origin=payload.capital_origin,
            eligibility_score=score,
            income_tax_exemption_years=exemption_years,
            tariff_savings_percentage=tariff_savings,
            ideal_lot_sector=ideal_lot,
            user_id=user_id
        )
        
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        
        return profile
    
    def get_profile(self, profile_id: str) -> OnboardingProfile:
        return self.session.get(OnboardingProfile, profile_id)
