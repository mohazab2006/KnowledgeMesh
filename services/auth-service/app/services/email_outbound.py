"""Optional SMTP for password reset. No-op when SMTP is not configured."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_password_reset_email(*, to_email: str, reset_token: str) -> bool:
    """
    Send reset link via SMTP. Returns True if an attempt was made and succeeded.
    """
    host = (settings.smtp_host or "").strip()
    if not host:
        return False

    if not (settings.smtp_from or "").strip():
        logger.warning("smtp_from is empty; cannot send password reset email")
        return False

    base = settings.frontend_public_url.rstrip("/")
    link = f"{base}/reset-password?token={reset_token}"

    msg = EmailMessage()
    msg["Subject"] = "Reset your KnowledgeMesh password"
    msg["From"] = settings.smtp_from.strip()
    msg["To"] = to_email
    msg.set_content(
        f"Use this link to choose a new password (expires soon):\n\n{link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    use_ssl = settings.smtp_use_ssl or settings.smtp_port == 465

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, settings.smtp_port, timeout=45) as smtp:
                if settings.smtp_user:
                    smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, settings.smtp_port, timeout=45) as smtp:
                if settings.smtp_use_tls:
                    smtp.starttls()
                if settings.smtp_user:
                    smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(msg)
        logger.info("Password reset email sent to %s", to_email)
        return True
    except Exception:
        logger.exception("SMTP send failed for password reset to %s", to_email)
        return False
