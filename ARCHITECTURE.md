# Architecture — LILA BLACK Player Journey Visualizer

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast dev iteration; component model maps well to layered visualization |
| **Rendering** | HTML5 Canvas (multi-layer) | Direct pixel control, high performance for path drawing + heatmaps |
| **Styling** | Tailwind CSS | Utility-first — fast to build a dark studio UI without fighting a component library |
| **Backend** | FastAPI (Python) | Same language as data science stack; async by default; auto-generated docs |
| **Data Query** | In-memory JSON (pre-processed) | ~3MB dataset fits in RAM; zero query latency vs. running DuckDB queries per request |
| **Deployment** | Railway (backend) + Vercel (frontend) | Free tier, Docker-native Railway for Python; Vercel edge CDN for React |

---

## Data Flow

```
Raw .nakama-0 files (1,243 parquet files, ~7MB)
        │
        ▼ preprocess.py (PyArrow + Pandas + NumPy)
        │
        ├── Decode event bytes → string
        ├── Parse user_id from filename (UUID = human, numeric = bot)
        ├── Parse match_id from filename
        ├── Apply world → pixel coordinate transform
        ├── Compute ts_rel = ts_ms - global_min_ts
        ├── Compute 32×32 heatmap grids (kills, deaths, traffic, loot)
        │       — per map (global) and per map+date
        └── Compute per-map insights (kill centroids, ratios, etc.)
                │
                ▼
        metadata.json (446 KB)          — match index, heatmaps, insights
        matches_data.json (2.9 MB)      — per-match player journeys
                │
                ▼ FastAPI (main.py)
                │
        GET /api/meta          → maps, dates, global insights
        GET /api/matches       → filtered match list (by map + date)
        GET /api/match/{id}    → full player journey for one match
        GET /api/heatmap       → 32×32 grid for a map/type/date
        GET /minimap/{name}    → minimap image file
                │
                ▼ React Frontend
                │
        FilterPanel     → drives selectedMap + selectedDate
        MatchList       → fetches + displays filtered matches
        MapCanvas       → 4-layer canvas stack (bg, heat, paths, events)
        PlaybackControls→ scrubs playbackTime (0→1) across match ts range
        InsightsPanel   → computed badges + centroid callouts
        LayerControls   → toggle paths / events / heatmap / type
```

---

## Coordinate Mapping

This is the trickiest part. Game world uses a 3D right-handed coordinate system. The minimap is a top-down 1024×1024 image.

**Key insight from the README:** Use `x` and `z` for 2D position; `y` is elevation (ignored for map overlay).

**Transform (per map):**
```
u = (x - origin_x) / scale          # normalize to 0–1 in world space
v = (z - origin_z) / scale

pixel_x = u × 1024
pixel_y = (1 − v) × 1024            # Y-flip: image origin is top-left, world origin is bottom-left
```

**Map configs:**

| Map | Scale | Origin X | Origin Z |
|---|---|---|---|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

All 89,104 events transformed cleanly into `[51, 963]` × `[75, 918]` pixel range — well within bounds.

---

## Timestamp Semantics (Key Assumption)

The README states ts represents "time elapsed within the match." However, the values are large (~1.77 billion ms), consistent with a game-engine internal clock — not milliseconds from match start.

**Observed behavior:**
- Each `.nakama-0` file spans ~0.4s of this internal clock
- Files sharing the same `match_id` cluster within a ~0.7s window
- The full dataset spans 399,765 ms (~400s, ~6.7 minutes) of engine time

**My interpretation:** These are telemetry snapshots from a live production server. Each file = one batch of position/event samples for one player in one match. The "5 days" refers to server-side data collection sessions, not 5 days of unique match times.

**Implementation:** I normalize ts to `ts_rel = ts_ms - global_min_ts` for ordering and playback. The playback scrubber shows relative position within a match's event sequence, not wall-clock seconds.

---

## Major Trade-offs

| Decision | What I chose | What I didn't choose | Why |
|---|---|---|---|
| Data serving | Pre-process → static JSON | DuckDB query per request | 89K rows fits in RAM; zero query latency; simpler |
| Rendering | Multi-layer HTML5 Canvas | Leaflet / deck.gl / WebGL | No tile server needed; full control over minimap overlay |
| Heatmap resolution | 32×32 grid, pre-computed | Real-time KDE or WebGL shader | Fast render, no backend compute per request; sufficient resolution for the use case |
| Timestamps | Relative ordering within match | True wall-clock | Data is game-engine internal; relative ordering is what matters for playback |
| Bot detection | Filename: numeric ID = bot | event type field | README explicitly states this; filename parsing is reliable |
| Frontend bundling | Separate frontend + backend | SSR or Streamlit | Cleaner separation; Vercel CDN for React, Railway for Python |

---

## What I'd Do Differently With More Time

1. **Richer playback** — The current data contains very short match windows (~0.7s). With server-side aggregation of position events into full-match trajectories (if the game engine emits them), the playback would be far more compelling.

2. **WebGL heatmap** — Use `deck.gl` or a custom WebGL shader for smooth, high-resolution heatmaps that update in real time without precomputation.

3. **Path clustering** — Use DBSCAN or k-means on position events to automatically detect "lanes" and "hotspots" in the map, surfacing them as Named Zones (e.g., "Northwest Chokepoint").

4. **Per-player profile view** — Click a player UUID to see all their matches across 5 days: win/loss/death patterns, favorite landing spots, average survival time.

5. **Match replay accuracy** — The event sampling is ~5ms per point. Interpolating between position samples would produce smoother path animations.

6. **Authentication + team sharing** — Share saved views/filters with a URL hash (already partially supported) and protect via auth.
