from __future__ import annotations

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def build(cls, items: list[T], total: int, page: int, size: int) -> "PaginatedResponse[T]":
        pages = max(1, (total + size - 1) // size) if size > 0 else 1
        return cls(items=items, total=total, page=page, size=size, pages=pages)
