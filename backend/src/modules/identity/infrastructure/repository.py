from typing import Optional
from sqlmodel import Session, select
from ..domain.entities import User
from src.modules.zeep_ingestion.domain.entities import Company

class IdentityRepository:
    def __init__(self, session: Session):
        self.session = session
        
    def get_user_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()
    
    def get_user_by_ruc(self, ruc: str) -> Optional[User]:
        statement = select(User).where(User.ruc == ruc)
        return self.session.exec(statement).first()
    
    def get_company_by_ruc(self, ruc: str) -> Optional[Company]:
        statement = select(Company).where(Company.ruc == ruc)
        return self.session.exec(statement).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def create_user(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_user_activity(self, user: User):
        from datetime import datetime
        user.last_active_at = datetime.utcnow()
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

    def update_user(self, user: User):
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

    def create_company(self, company: Company) -> Company:
        self.session.add(company)
        self.session.commit()
        self.session.refresh(company)
        return company
