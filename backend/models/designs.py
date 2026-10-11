from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class TileAssignment(BaseModel):
    tile_name: str
    tile_image: str
    surface: str
    size: str


class DesignGenerateRequest(BaseModel):
    area: str
    room_image: str
    # Fallback sample image, used only if real AI generation is unavailable or fails.
    generated_image: str = ""
    style: str
    tile_assignments: list[TileAssignment] = Field(min_length=1, max_length=3)
    customer_name: Optional[str] = Field(default=None, max_length=120)
    showroom_mode: bool = False


class Design(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    area: str
    room_image: str
    generated_image: str
    style: str
    tile_assignments: list[TileAssignment]
    customer_name: Optional[str] = None
    showroom_mode: bool = False
    status: Literal["ready"] = "ready"
    generation_mode: Literal["ai_generated", "mocked_demo"] = "mocked_demo"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))