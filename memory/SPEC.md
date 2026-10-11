# Tiles Hub Living Spec

## Product
Tiles Hub is a responsive tile visualization and showroom workspace. Customers choose an area, upload a room photo and up to three tile references, map each tile to a surface, select size and style, then create and save a before/after concept.

## Current MVP behavior
- The AI visualization is **MOCKED** and explicitly labeled in the interface and API as `mocked_demo`; uploaded tile references and settings are preserved, while the after image is a curated sample.
- Tile catalogue and generated design records persist in MongoDB.
- Navigation: Home, AI Design, My Tiles, My Designs, Showroom, Profile.
- Save is part of Generate; users can download the result, print a design sheet/PDF, and open a WhatsApp share.
- Tiles Hub is an installable PWA with a standalone manifest, branded icon/splash, service-worker app shell, safe-area mobile navigation, and install prompt where the browser supports it.
- Room, tile, and catalogue uploads have separate native Take Photo and Choose from Gallery actions. There is no hardcoded source-file size limit. Originals stay in browser memory for preview; a high-quality JPEG working copy is automatically resized/compressed for API persistence.
- Supported picker formats are JPG/JPEG, PNG, WEBP, HEIC and HEIF. HEIC/HEIF is converted client-side when the browser cannot decode it natively.
- Upload processing exposes progress, Use Photo, Retake, Change Photo, Gallery, friendly permission/format errors, and Try Again without raw technical messages.

## Data model
- Tile: id, name, code, size, finish, category, image, optional price, description, created_at.
- Design: id, area, room_image, generated_image, style, tile_assignments, optional customer_name, showroom_mode, status, generation_mode, created_at.

## Key flows
1. AI Design: select area → capture or choose room → review and Use Photo → capture/choose 1–3 tiles → review/map surfaces/sizes → choose suggestion → Generate My Tile Design → compare/save/share/change tile/generate another.
2. My Tiles: browse seeded catalogue, add a camera/gallery tile with metadata, delete owned catalogue entries.
3. Showroom: start customer concept, review recent saved designs, share via WhatsApp.

## Image lifecycle
- The original `File` and object URL remain session-local and are never rejected based on byte size.
- The processor reads dimensions, converts HEIC when needed, preserves aspect ratio, limits only the temporary working copy dimensions, and iteratively encodes it for safe API/Mongo transport.
- Object URLs are revoked when a photo is changed, removed, or the workspace resets to avoid mobile memory leaks.

## Auth
No authentication or gated roles in this MVP. Showroom Mode is an open professional workspace.