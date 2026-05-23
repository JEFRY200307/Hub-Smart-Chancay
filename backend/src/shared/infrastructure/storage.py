from __future__ import annotations

import hashlib
import os
import uuid
from pathlib import Path


def save_upload(file_bytes: bytes, filename: str, subfolder: str = "docs") -> tuple[str, str, int]:
    """Guarda archivo en STORAGE_LOCAL_PATH. Retorna (url_storage, hash_sha256, size_bytes)."""
    base = Path(os.getenv("STORAGE_LOCAL_PATH", "./uploads"))
    target_dir = base / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(filename).suffix or ".bin"
    stored_name = f"{uuid.uuid4()}{ext}"
    path = target_dir / stored_name
    path.write_bytes(file_bytes)

    digest = hashlib.sha256(file_bytes).hexdigest()
    url = f"/uploads/{subfolder}/{stored_name}"
    return url, digest, len(file_bytes)
