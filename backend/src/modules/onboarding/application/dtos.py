from pydantic import BaseModel, ConfigDict
from typing import Optional
import uuid

class ProfileSubmitDTO(BaseModel):
    sector: str
    investment_usd: float
    required_sqm: float
    capital_origin: str

class OnboardingResultsDTO(BaseModel):
    id: uuid.UUID
    eligibility_score: int
    income_tax_exemption_years: int
    tariff_savings_percentage: float
    ideal_lot_sector: str
    
    model_config = ConfigDict(from_attributes=True)
