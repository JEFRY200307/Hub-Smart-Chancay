#!/usr/bin/env python3
"""Marca como verificados los usuarios demo (tras registro API sin OTP)."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, select

from src.shared.infrastructure.database import engine
from src.modules.identity.domain.entities import User

DEMO_EMAILS = [
    "extranjera.cn@comex-ai.test",
    "inversor@hubchancay.pe",
]


def main() -> None:
    with Session(engine) as session:
        for email in DEMO_EMAILS:
            user = session.exec(select(User).where(User.email == email)).first()
            if not user:
                print(f"  — no existe: {email}")
                continue
            user.is_verified = True
            user.is_active = True
            session.add(user)
            print(f"  OK verificado: {email}")
        session.commit()
    print("Listo. Prueba login de nuevo.")


if __name__ == "__main__":
    main()
