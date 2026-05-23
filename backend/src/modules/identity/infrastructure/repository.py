from __future__ import annotations
from typing import Optional
import uuid
from datetime import datetime
from sqlmodel import Session, select

from ..domain.entities import User, RefreshToken, EmailVerificationToken
from ..domain.user_profile import UserProfile


class IdentityRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.session.exec(select(User).where(User.email == email)).first()

    def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return self.session.get(User, user_id)

    def create_user(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_user(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_last_login(self, user: User) -> None:
        user.last_login_at = datetime.utcnow()
        self.session.add(user)
        self.session.commit()

    # ── Refresh Token management ───────────────────────────────────────────────

    def create_refresh_token(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        self.session.commit()
        self.session.refresh(token)
        return token

    def get_refresh_token(self, token_str: str) -> Optional[RefreshToken]:
        return self.session.exec(
            select(RefreshToken).where(RefreshToken.token == token_str)
        ).first()

    def revoke_refresh_token(self, token_str: str) -> None:
        record = self.get_refresh_token(token_str)
        if record:
            record.revoked_at = datetime.utcnow()
            self.session.add(record)
            self.session.commit()

    def get_active_otp(self, user_id: uuid.UUID) -> Optional[EmailVerificationToken]:
        return self.session.exec(
            select(EmailVerificationToken)
            .where(EmailVerificationToken.user_id == user_id)
            .where(EmailVerificationToken.used_at.is_(None))
            .order_by(EmailVerificationToken.created_at.desc())
        ).first()

    def create_otp_token(self, token: EmailVerificationToken) -> EmailVerificationToken:
        self.session.add(token)
        self.session.commit()
        self.session.refresh(token)
        return token

    def update_otp_token(self, token: EmailVerificationToken) -> EmailVerificationToken:
        self.session.add(token)
        self.session.commit()
        self.session.refresh(token)
        return token

    def get_user_profile(self, user_id: uuid.UUID) -> Optional[UserProfile]:
        return self.session.get(UserProfile, user_id)

    def upsert_user_profile(self, profile: UserProfile) -> UserProfile:
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile

    def revoke_all_user_tokens(self, user_id: uuid.UUID) -> None:
        tokens = self.session.exec(
            select(RefreshToken)
            .where(RefreshToken.user_id == user_id)
            .where(RefreshToken.revoked_at.is_(None))
        ).all()
        now = datetime.utcnow()
        for t in tokens:
            t.revoked_at = now
            self.session.add(t)
        self.session.commit()
