from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class TileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=60)
    size: str
    finish: str
    category: str
    image: str
    price: Optional[float] = Field(default=None, ge=0)
    description: str = Field(default="", max_length=500)


class TileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    code: Optional[str] = Field(default=None, min_length=1, max_length=60)
    size: Optional[str] = None
    finish: Optional[str] = None
    category: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)


class Tile(TileCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))