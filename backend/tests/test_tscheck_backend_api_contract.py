"""Backend API contract: root identifies mode, tiles list has seeded rows,
valid design generation returns 201 ready/mocked_demo, unknown design returns 404."""


def test_root_identifies_tiles_hub_mocked_demo(client):
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body.get("message") == "Tiles Hub API"
    assert body.get("generation_mode") == "mocked_demo"


def test_tiles_list_returns_seeded_records(client):
    resp = client.get("/tiles")
    assert resp.status_code == 200
    tiles = resp.json()
    codes = {t["code"] for t in tiles}
    assert {"TH-MR-101", "TH-PM-204", "TH-TR-310"}.issubset(codes)


def test_valid_design_generation_returns_201_ready_mocked_demo(client):
    payload = {
        "area": "Bathroom",
        "room_image": "data:image/png;base64,AAAA",
        "generated_image": "data:image/png;base64,BBBB",
        "style": "Modern",
        "tile_assignments": [
            {
                "tile_name": "tscheck-contract-tile",
                "tile_image": "data:image/png;base64,CCCC",
                "surface": "Floor",
                "size": "24x24",
            }
        ],
    }
    resp = client.post("/designs/generate", json=payload)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "ready"
    assert body["generation_mode"] == "mocked_demo"
    assert body["area"] == "Bathroom"
    assert "id" in body


def test_unknown_design_returns_404(client):
    resp = client.get("/designs/tscheck-nonexistent-design-id")
    assert resp.status_code == 404
