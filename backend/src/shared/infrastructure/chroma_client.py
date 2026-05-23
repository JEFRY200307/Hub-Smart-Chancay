"""Cliente ChromaDB: Chroma Cloud (producción) o servidor HTTP local (desarrollo)."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any


def _normalize_cloud_host(host: str) -> str:
    return host.strip().removeprefix("https://").removeprefix("http://").split("/")[0]


@lru_cache(maxsize=1)
def get_chroma_client() -> Any:
    """
    Chroma Cloud si existen CHROMA_API_KEY + CHROMA_TENANT + CHROMA_DATABASE.
    Si no, HttpClient contra CHROMA_HOST:CHROMA_PORT (Docker local).
    """
    import chromadb

    api_key = os.getenv("CHROMA_API_KEY", "").strip()
    tenant = os.getenv("CHROMA_TENANT", "").strip()
    database = os.getenv("CHROMA_DATABASE", "").strip()

    if api_key and tenant and database:
        host = os.getenv("CHROMA_HOST", "api.trychroma.com").strip()
        kwargs: dict[str, Any] = {
            "api_key": api_key,
            "tenant": tenant,
            "database": database,
        }
        if host:
            kwargs["cloud_host"] = _normalize_cloud_host(host)
            kwargs["cloud_port"] = int(os.getenv("CHROMA_PORT", "443"))
            kwargs["enable_ssl"] = os.getenv("CHROMA_SSL", "true").lower() in (
                "1",
                "true",
                "yes",
            )
        return chromadb.CloudClient(**kwargs)

    host = os.getenv("CHROMA_HOST", "localhost")
    port = int(os.getenv("CHROMA_PORT", "8001"))
    return chromadb.HttpClient(host=host, port=port)


def check_chroma_connection() -> dict[str, Any]:
    """Usado por /health."""
    try:
        client = get_chroma_client()
        heartbeat = client.heartbeat()
        collections = client.list_collections()
        mode = "cloud" if os.getenv("CHROMA_API_KEY") else "http"
        return {
            "connected": True,
            "mode": mode,
            "heartbeat": heartbeat,
            "collections_count": len(collections),
        }
    except Exception as exc:
        return {"connected": False, "error": str(exc)}
