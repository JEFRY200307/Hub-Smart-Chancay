from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ZEEPOpportunityDTO(BaseModel):
    id: str
    title: str
    category: str
    match_score: Optional[int] = None
    description: str
    tags: List[str]
    company_name: str
    posted_ago: str
    
    model_config = ConfigDict(from_attributes=True)

class OperatorDTO(BaseModel):
    id: str
    name: str
    tier: str
    description: str
    services: List[str]
    rating: float
    verified: bool
