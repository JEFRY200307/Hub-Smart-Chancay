from __future__ import annotations

import hashlib
import os
import uuid
from pathlib import Path


def storage_backend() -> str:
    return os.getenv("STORAGE_BACKEND", "local").lower()


def save_upload(
    file_bytes: bytes,
    filename: str,
    subfolder: str = "docs",
    *,
    user_id: str | None = None,
    profile_id: str | None = None,
    content_type: str = "application/pdf",
) -> tuple[str, str, int]:
    """
    Guarda archivo según STORAGE_BACKEND (local | supabase).
    Retorna (url_storage, hash_sha256, size_bytes).
    """
    if storage_backend() == "supabase":
        if not user_id or not profile_id:
            raise ValueError("user_id y profile_id son obligatorios para Supabase Storage")
        from .supabase_storage import upload_project_document

        return upload_project_document(
            file_bytes,
            filename,
            user_id=str(user_id),
            profile_id=str(profile_id),
            content_type=content_type,
        )

    base = Path(os.getenv("STORAGE_LOCAL_PATH", "./uploads"))
    target_dir = base / subfolder
    if user_id and profile_id:
        target_dir = target_dir / str(user_id) / str(profile_id)
    target_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(filename).suffix or ".bin"
    stored_name = f"{uuid.uuid4()}{ext}"
    path = target_dir / stored_name
    path.write_bytes(file_bytes)

    digest = hashlib.sha256(file_bytes).hexdigest()
    rel = path.relative_to(base)
    url = f"/uploads/{rel.as_posix()}"
    return url, digest, len(file_bytes)
