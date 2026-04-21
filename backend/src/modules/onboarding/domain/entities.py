import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class OnboardingProfile(SQLModel, table=True):
    __tablename__ = "onboarding_profiles"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sector: str
    investment_usd: float
    required_sqm: float
    capital_origin: str
    
    # Resultados calculados
    eligibility_score: int = Field(default=0)
    income_tax_exemption_years: int = Field(default=0)
    tariff_savings_percentage: float = Field(default=0.0)
    ideal_lot_sector: str = Field(default="")
    
    # Metadatos
    user_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
