from __future__ import annotations

import os
import re
import uuid
from pathlib import Path

import requests

from src.shared.domain.exceptions import DomainException


def _safe_filename(name: str) -> str:
    base = Path(name).name
    base = re.sub(r"[^\w.\-]", "_", base, flags=re.ASCII)
    return base[:180] or "documento.pdf"


def upload_project_document(
    file_bytes: bytes,
    filename: str,
    user_id: str,
    profile_id: str,
    content_type: str = "application/pdf",
) -> tuple[str, str, int]:
    """
    Sube a Supabase Storage bucket `proyectos`.
    Ruta: {user_id}/{profile_id}/{uuid}_{filename}
    Retorna (url_publica, hash_sha256, size_bytes).
    """
    import hashlib

    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "proyectos")

    if not supabase_url or not service_key:
        raise DomainException(
            title="Storage no configurado",
            detail="Defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para STORAGE_BACKEND=supabase.",
            status_code=503,
        )

    safe = _safe_filename(filename)
    object_path = f"{user_id}/{profile_id}/{uuid.uuid4()}_{safe}"
    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{object_path}"

    digest = hashlib.sha256(file_bytes).hexdigest()
    headers = {
        "Authorization": f"Bearer {service_key}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    resp = requests.post(upload_url, data=file_bytes, headers=headers, timeout=120)
    if resp.status_code not in (200, 201):
        raise DomainException(
            title="Error de almacenamiento",
            detail=f"Supabase Storage respondió {resp.status_code}: {resp.text[:300]}",
            status_code=502,
        )

    public = os.getenv("SUPABASE_STORAGE_PUBLIC", "true").lower() in ("1", "true", "yes")
    if public:
        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{object_path}"
    else:
        public_url = f"{supabase_url}/storage/v1/object/sign/{bucket}/{object_path}"

    return public_url, digest, len(file_bytes)
