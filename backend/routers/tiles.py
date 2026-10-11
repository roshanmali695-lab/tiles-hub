from fastapi import APIRouter, HTTPException, Response, status
from pymongo.errors import DuplicateKeyError

from lib.db import db
from models.tiles import Tile, TileCreate, TileUpdate

router = APIRouter(prefix="/tiles", tags=["tiles"])


@router.get("", response_model=list[Tile])
async def list_tiles():
    docs = await db.tiles.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [Tile(**doc) for doc in docs]


@router.post("", response_model=Tile, status_code=status.HTTP_201_CREATED)
async def create_tile(payload: TileCreate):
    tile = Tile(**payload.model_dump())
    try:
        await db.tiles.insert_one(tile.model_dump())
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Tile code already exists") from exc
    return tile


@router.put("/{tile_id}", response_model=Tile)
async def update_tile(tile_id: str, payload: TileUpdate):
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=422, detail="At least one field is required")
    try:
        result = await db.tiles.find_one_and_update(
            {"id": tile_id}, {"$set": updates}, return_document=True, projection={"_id": 0}
        )
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Tile code already exists") from exc
    if not result:
        raise HTTPException(status_code=404, detail="Tile not found")
    return Tile(**result)


@router.delete("/{tile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tile(tile_id: str):
    result = await db.tiles.delete_one({"id": tile_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tile not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)