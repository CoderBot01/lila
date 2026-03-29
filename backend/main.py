"""
LILA BLACK - Player Journey Visualization Tool
FastAPI Backend
"""

import json
import os
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from typing import Optional, List
import gzip

app = FastAPI(title="LILA Black Analytics API", version="1.0.0")

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load pre-processed data at startup ─────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

with open(os.path.join(DATA_DIR, "metadata.json")) as f:
    METADATA = json.load(f)

with open(os.path.join(DATA_DIR, "matches_data.json")) as f:
    MATCHES_DATA = json.load(f)

MATCHES_INDEX = {m["id"]: m for m in METADATA["matches"]}

print(f"✅ Loaded {len(METADATA['matches'])} matches, {len(MATCHES_DATA)} match records")

# ── Helpers ────────────────────────────────────────────────────────────────

def get_filtered_matches(
    map_id: Optional[str] = None,
    date: Optional[str] = None,
    match_id: Optional[str] = None
) -> List[dict]:
    matches = METADATA["matches"]
    if map_id:
        matches = [m for m in matches if m["map"] == map_id]
    if date:
        matches = [m for m in matches if m["date"] == date]
    if match_id:
        matches = [m for m in matches if m["id"] == match_id]
    return matches

# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "matches": len(METADATA["matches"])}

@app.get("/api/meta")
def get_meta():
    """Return global metadata: maps, dates, summary stats."""
    maps = list(set(m["map"] for m in METADATA["matches"]))
    dates = sorted(list(set(m["date"] for m in METADATA["matches"])))
    return {
        "maps": sorted(maps),
        "dates": dates,
        "total_matches": len(METADATA["matches"]),
        "total_duration_ms": METADATA["total_duration_ms"],
        "insights": METADATA["insights"],
    }

@app.get("/api/matches")
def list_matches(
    map_id: Optional[str] = Query(None, alias="map"),
    date: Optional[str] = None,
):
    """Return filtered list of matches for the sidebar."""
    matches = get_filtered_matches(map_id=map_id, date=date)
    # Sort by ts_min so they appear in chronological order
    matches = sorted(matches, key=lambda m: m["ts_min"])
    return {"matches": matches, "total": len(matches)}

@app.get("/api/match/{match_id}")
def get_match(match_id: str):
    """Return full player journey data for a single match."""
    if match_id not in MATCHES_DATA:
        raise HTTPException(404, f"Match {match_id} not found")
    data = MATCHES_DATA[match_id]
    meta = MATCHES_INDEX.get(match_id, {})
    return {
        "id": match_id,
        "map": data["map"],
        "date": data["date"],
        "meta": meta,
        "players": data["players"],
    }

@app.get("/api/heatmap")
def get_heatmap(
    map_id: str = Query(..., alias="map"),
    type: str = "kills",
    date: Optional[str] = None,
):
    """Return pre-computed heatmap grid (32×32) normalized 0-1."""
    valid_types = ["kills", "deaths", "traffic", "loot"]
    if type not in valid_types:
        raise HTTPException(400, f"type must be one of {valid_types}")

    if date and date != "all":
        hm_source = METADATA.get("heatmaps_by_date", {}).get(date, {})
        if map_id not in hm_source:
            # Fall back to global
            hm_source = METADATA["heatmaps"]
        else:
            hm_source = hm_source
    else:
        hm_source = METADATA["heatmaps"]

    if map_id not in hm_source:
        raise HTTPException(404, f"No heatmap data for map {map_id}")

    grid = hm_source[map_id][type]
    return {"map": map_id, "type": type, "date": date, "grid": grid, "size": 32}

@app.get("/api/insights/{map_id}")
def get_insights(map_id: str):
    """Return computed insights for a map."""
    insights = METADATA["insights"]
    if map_id not in insights:
        raise HTTPException(404, f"No insights for map {map_id}")
    return insights[map_id]

# ── Static files (minimap images) ─────────────────────────────────────────

@app.get("/minimap/{filename}")
def get_minimap(filename: str):
    """Serve minimap images."""
    allowed = {
        "AmbroseValley": "AmbroseValley_Minimap.png",
        "GrandRift": "GrandRift_Minimap.png",
        "Lockdown": "Lockdown_Minimap.jpg",
    }
    if filename not in allowed:
        raise HTTPException(404)
    fpath = os.path.join(DATA_DIR, allowed[filename])
    return FileResponse(fpath)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
