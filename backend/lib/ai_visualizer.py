"""Real AI tile visualization using Google's Gemini image model directly (no Emergent needed).

Edits the customer's room photo so the chosen tiles appear on the chosen surfaces.
Returns a data URL on success, or None on ANY failure so the caller can fall back to the demo image.

Env: GEMINI_API_KEY (required; free key from aistudio.google.com/apikey)
     GEMINI_IMAGE_MODEL (optional, default below)
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-2.5-flash-image"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def _parse_data_url(data_url: str) -> tuple[str, str]:
    """'data:image/jpeg;base64,AAAA' -> ('image/jpeg', 'AAAA')."""
    if data_url.startswith("data:") and "," in data_url:
        header, data = data_url.split(",", 1)
        mime = header[5:].split(";")[0] or "image/jpeg"
        return mime, data
    return "image/jpeg", data_url


def build_prompt(area: str, style: str, assignments: list) -> str:
    lines = [
        f"- Tile reference image {i} ('{a.tile_name}', size {a.size}) goes on: {a.surface}."
        for i, a in enumerate(assignments, start=1)
    ]
    mapping = "\n".join(lines)
    return (
        "You are a professional interior visualization tool. The FIRST image is a photo of the customer's "
        f"{area}. The remaining images are tile samples.\n"
        "Edit the first photo so the tile samples are installed on the requested surfaces:\n"
        f"{mapping}\n"
        "Rules: keep the room's exact layout, perspective, camera angle, furniture, fixtures, and lighting. "
        "Change ONLY the requested surfaces. Reproduce each tile's exact colour, pattern and texture from its "
        "sample image, scaled realistically to its stated size, with correct perspective, natural grout lines, "
        "and realistic reflections or shadows. "
        f"Overall style: {style}. Return one photorealistic edited image of the room."
    )


async def generate_tiled_room(room_image: str, area: str, style: str, assignments: list) -> str | None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY missing; skipping AI generation")
        return None
    try:
        parts: list[dict] = [{"text": build_prompt(area, style, assignments)}]
        for image in [room_image] + [a.tile_image for a in assignments]:
            mime, data = _parse_data_url(image)
            parts.append({"inline_data": {"mime_type": mime, "data": data}})

        model = os.environ.get("GEMINI_IMAGE_MODEL", DEFAULT_MODEL)
        async with httpx.AsyncClient(timeout=120) as http:
            response = await http.post(
                ENDPOINT.format(model=model),
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "contents": [{"parts": parts}],
                    "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
                },
            )
        response.raise_for_status()
        for candidate in response.json().get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    mime = inline.get("mimeType") or inline.get("mime_type") or "image/png"
                    return f"data:{mime};base64,{inline['data']}"
        logger.warning("Gemini returned no image: %s", response.text[:300])
        return None
    except Exception:  # noqa: BLE001 - any failure must fall back, never break the app
        logger.exception("AI tile generation failed")
        return None
