import asyncio
from datetime import datetime, timezone

from lib.db import client, db, ensure_indexes

TILES = [
    {
        "id": "tile-calacatta-gold",
        "name": "Calacatta Gold",
        "code": "TH-MR-101",
        "size": "24×48",
        "finish": "High Gloss",
        "category": "Marble Look",
        "image": "https://images.unsplash.com/photo-1551554781-c46200ea959d?auto=format&fit=crop&w=1000&q=85",
        "price": 8.5,
        "description": "Warm white marble look with elegant gold veining.",
    },
    {
        "id": "tile-noir-marquina",
        "name": "Noir Marquina",
        "code": "TH-PM-204",
        "size": "24×24",
        "finish": "Polished",
        "category": "Premium Tiles",
        "image": "https://images.unsplash.com/photo-1566305977571-5666677c6e98?auto=format&fit=crop&w=1000&q=85",
        "price": 12.0,
        "description": "Deep black marble finish for statement walls.",
    },
    {
        "id": "tile-soft-terrazzo",
        "name": "Soft Terrazzo",
        "code": "TH-TR-310",
        "size": "12×24",
        "finish": "Matt",
        "category": "Terrazzo",
        "image": "https://images.unsplash.com/photo-1520420253244-9ff6536abf60?auto=format&fit=crop&w=1000&q=85",
        "price": 6.75,
        "description": "A subtle terrazzo texture for contemporary floors.",
    },
]


async def seed_tiles():
    """Insert the starter catalogue only for tiles that don't exist yet (never overwrites edits)."""
    now = datetime.now(timezone.utc)
    for tile in TILES:
        await db.tiles.update_one(
            {"id": tile["id"]}, {"$setOnInsert": {**tile, "created_at": now}}, upsert=True
        )


async def main():
    await seed_tiles()
    await ensure_indexes()
    client.close()


if __name__ == "__main__":
    asyncio.run(main())