from fastapi import APIRouter, HTTPException, Response, status

from lib.ai_visualizer import generate_tiled_room
from lib.db import db
from models.designs import Design, DesignGenerateRequest

router = APIRouter(prefix="/designs", tags=["designs"])


@router.get("", response_model=list[Design])
async def list_designs():
    docs = await db.designs.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Design(**doc) for doc in docs]


@router.get("/{design_id}", response_model=Design)
async def get_design(design_id: str):
    doc = await db.designs.find_one({"id": design_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Design not found")
    return Design(**doc)


@router.post("/generate", response_model=Design, status_code=status.HTTP_201_CREATED)
async def generate_design(payload: DesignGenerateRequest):
    data = payload.model_dump()
    ai_image = await generate_tiled_room(
        payload.room_image, payload.area, payload.style, payload.tile_assignments
    )
    if ai_image:
        data["generated_image"] = ai_image
        data["generation_mode"] = "ai_generated"
    else:
        data["generation_mode"] = "mocked_demo"
        if not data["generated_image"]:
            raise HTTPException(status_code=503, detail="AI generation unavailable. Please try again.")
    design = Design(**data)
    await db.designs.insert_one(design.model_dump())
    return design


@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design(design_id: str):
    result = await db.designs.delete_one({"id": design_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)