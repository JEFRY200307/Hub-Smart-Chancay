from __future__ import annotations

import logging
import os
import smtplib
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Envía OTP por SMTP. En development sin credenciales, solo loguea el código."""
    subject = "COMEX.AI — Código de verificación"
    body = (
        f"Tu código de verificación COMEX.AI es: {otp_code}\n\n"
        "Expira en 15 minutos. No compartas este código."
    )

    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM", "COMEX.AI <noreply@comex.ai>")

    if os.getenv("ENVIRONMENT", "development") == "development" and not smtp_password:
        logger.info("OTP para %s: %s (modo desarrollo — SMTP no configurado)", to_email, otp_code)
        return True

    if not smtp_host or not smtp_user or not smtp_password:
        logger.warning("SMTP incompleto; OTP no enviado por correo para %s", to_email)
        return False

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = email_from
    msg["To"] = to_email

    port = int(os.getenv("SMTP_PORT", "587"))
    use_ssl = os.getenv("SMTP_USE_SSL", "").lower() in ("1", "true", "yes") or port == 465

    if use_ssl:
        with smtplib.SMTP_SSL(smtp_host, port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
    return True
