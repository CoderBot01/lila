"""
LILA BLACK - Data Preprocessing Script
Converts raw .nakama-0 parquet files → optimized JSON for the API.

Usage:
    python preprocess.py --data-dir /path/to/player_data --out-dir ./data
"""

import pyarrow.parquet as pq
import pandas as pd
import numpy as np
import json
import os
import argparse
from pathlib import Path

# ── Map configuration (from README) ───────────────────────────────────────────
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}
IMAGE_SIZE = 1024

DAYS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

def world_to_pixel(x_arr, z_arr, map_id):
    """
    Convert world coordinates (x, z) to minimap pixel coordinates.

    Formula (from README):
        u = (x - origin_x) / scale
        v = (z - origin_z) / scale
        pixel_x = u * 1024
        pixel_y = (1 - v) * 1024   ← Y flipped (image top-left origin)
    """
    cfg = MAP_CONFIG[map_id]
    u = (x_arr - cfg["origin_x"]) / cfg["scale"]
    v = (z_arr - cfg["origin_z"]) / cfg["scale"]
    px = u * IMAGE_SIZE
    py = (1 - v) * IMAGE_SIZE
    return np.round(px, 1), np.round(py, 1)


def load_all_data(data_dir: Path) -> pd.DataFrame:
    """Load all parquet files and return a unified DataFrame."""
    frames = []
    total = 0
    for day in DAYS:
        day_dir = data_dir / day
        if not day_dir.exists():
            continue
        files = [f for f in day_dir.iterdir() if not f.name.startswith(".")]
        print(f"  Loading {day}: {len(files)} files")
        for fpath in files:
            try:
                table = pq.read_table(str(fpath))
                df = table.to_pandas()
                # Decode bytes event column
                df["event"] = df["event"].apply(
                    lambda x: x.decode("utf-8") if isinstance(x, bytes) else x
                )
                df["date"] = day
                # Parse user_id and match_id from filename
                stem = fpath.stem  # removes .nakama-0 but stem only removes last suffix
                # Actually filename is like user_match.nakama-0 → stem = user_match.nakama
                name = fpath.name.replace(".nakama-0", "")
                parts = name.split("_", 1)
                df["file_user_id"] = parts[0] if len(parts) > 0 else ""
                df["file_match_id"] = parts[1] if len(parts) > 1 else ""
                # Detect bots: numeric user_id = bot
                df["is_bot"] = parts[0].isdigit() if parts else False
                frames.append(df)
                total += len(df)
            except Exception as e:
                pass  # Skip corrupt files silently
    print(f"  Total rows loaded: {total:,}")
    return pd.concat(frames, ignore_index=True)


def compute_heatmap(df: pd.DataFrame, event_types: list, grid_size: int = 32) -> list:
    """Compute a normalized heatmap grid from event positions."""
    mask = df["event"].isin(event_types)
    sub = df[mask]
    if len(sub) == 0:
        return [[0.0] * grid_size for _ in range(grid_size)]

    grid = np.zeros((grid_size, grid_size))
    gx = np.clip((sub["px"].values / IMAGE_SIZE * grid_size).astype(int), 0, grid_size - 1)
    gy = np.clip((sub["py"].values / IMAGE_SIZE * grid_size).astype(int), 0, grid_size - 1)
    for x, y in zip(gx, gy):
        grid[y, x] += 1

    if grid.max() > 0:
        grid = grid / grid.max()
    return grid.round(3).tolist()


def build_match_data(df: pd.DataFrame) -> dict:
    """Build per-match player journey data."""
    match_data = {}
    for match_id, group in df.groupby("file_match_id"):
        players = []
        for uid, player_group in group.groupby("file_user_id"):
            player_group = player_group.sort_values("ts_rel")
            events = []
            for _, ev in player_group.iterrows():
                events.append([
                    ev["event"],
                    round(float(ev["px"]), 1),
                    round(float(ev["py"]), 1),
                    int(ev["ts_rel"])
                ])
            players.append({
                "uid": uid,
                "bot": bool(player_group["is_bot"].iloc[0]),
                "events": events,
            })
        match_data[match_id] = {
            "map": group["map_id"].iloc[0],
            "date": group["date"].iloc[0],
            "players": players,
        }
    return match_data


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="../../player_data", help="Path to player_data directory")
    parser.add_argument("--out-dir", default="./data", help="Output directory for JSON files")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=== LILA BLACK Data Preprocessor ===")
    print(f"Input:  {data_dir}")
    print(f"Output: {out_dir}")
    print()

    # Load all data
    print("Loading parquet files...")
    df = load_all_data(data_dir)

    # Add timestamp (relative to global minimum)
    ts_ms = df["ts"].astype("int64")
    global_min_ts = ts_ms.min()
    df["ts_ms"] = ts_ms
    df["ts_rel"] = ts_ms - global_min_ts

    # Add pixel coordinates
    print("Computing pixel coordinates...")
    px_col = np.zeros(len(df))
    py_col = np.zeros(len(df))
    for map_id in MAP_CONFIG:
        mask = df["map_id"] == map_id
        if mask.any():
            px, py = world_to_pixel(df.loc[mask, "x"].values, df.loc[mask, "z"].values, map_id)
            px_col[mask.values] = px
            py_col[mask.values] = py
    df["px"] = np.round(px_col, 1)
    df["py"] = np.round(py_col, 1)

    # Build match index
    print("Building match index...")
    match_stats = df.groupby(["file_match_id", "map_id", "date"]).agg(
        ts_min=("ts_rel", "min"),
        ts_max=("ts_rel", "max"),
        n_events=("event", "count"),
        n_humans=("is_bot", lambda x: (~x.astype(bool)).sum()),
        n_bots=("is_bot", lambda x: x.astype(bool).sum()),
        n_players=("file_user_id", "nunique"),
    ).reset_index()

    match_list = [
        {
            "id": row["file_match_id"],
            "map": row["map_id"],
            "date": row["date"],
            "ts_min": int(row["ts_min"]),
            "ts_max": int(row["ts_max"]),
            "n_events": int(row["n_events"]),
            "n_humans": int(row["n_humans"]),
            "n_bots": int(row["n_bots"]),
            "n_players": int(row["n_players"]),
        }
        for _, row in match_stats.iterrows()
    ]

    # Heatmaps
    print("Computing heatmaps...")
    heatmaps = {}
    heatmaps_by_date = {}
    for map_id in MAP_CONFIG:
        map_df = df[df["map_id"] == map_id]
        heatmaps[map_id] = {
            "kills":   compute_heatmap(map_df, ["Kill", "BotKill"]),
            "deaths":  compute_heatmap(map_df, ["Killed", "BotKilled", "KilledByStorm"]),
            "traffic": compute_heatmap(map_df, ["Position", "BotPosition"]),
            "loot":    compute_heatmap(map_df, ["Loot"]),
        }
    for date in df["date"].unique():
        date_df = df[df["date"] == date]
        heatmaps_by_date[date] = {}
        for map_id in MAP_CONFIG:
            map_df = date_df[date_df["map_id"] == map_id]
            if len(map_df) == 0:
                continue
            heatmaps_by_date[date][map_id] = {
                "kills":   compute_heatmap(map_df, ["Kill", "BotKill"]),
                "deaths":  compute_heatmap(map_df, ["Killed", "BotKilled", "KilledByStorm"]),
                "traffic": compute_heatmap(map_df, ["Position", "BotPosition"]),
                "loot":    compute_heatmap(map_df, ["Loot"]),
            }

    # Insights
    print("Computing insights...")
    insights = {}
    for map_id in MAP_CONFIG:
        map_df = df[df["map_id"] == map_id]
        kill_df = map_df[map_df["event"].isin(["Kill", "BotKill", "Killed", "BotKilled"])]
        storm_df = map_df[map_df["event"] == "KilledByStorm"]
        loot_df = map_df[map_df["event"] == "Loot"]
        insights[map_id] = {
            "total_kills": int(len(kill_df)),
            "total_loot": int(len(loot_df)),
            "storm_deaths": int(len(storm_df)),
            "total_players": int(map_df["file_user_id"].nunique()),
            "total_matches": int(map_df["file_match_id"].nunique()),
            "human_matches": int(map_df[~map_df["is_bot"]]["file_match_id"].nunique()),
            "bot_ratio": round(float(map_df["is_bot"].mean()), 3),
        }
        if len(storm_df) > 0:
            insights[map_id]["storm_centroid"] = [round(float(storm_df["px"].mean()), 1), round(float(storm_df["py"].mean()), 1)]
        if len(kill_df) > 0:
            insights[map_id]["kill_centroid"] = [round(float(kill_df["px"].mean()), 1), round(float(kill_df["py"].mean()), 1)]

    # Save metadata.json
    metadata = {
        "global_min_ts": int(global_min_ts),
        "total_duration_ms": int(df["ts_rel"].max()),
        "matches": match_list,
        "heatmaps": heatmaps,
        "heatmaps_by_date": heatmaps_by_date,
        "insights": insights,
    }
    with open(out_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, separators=(",", ":"))
    print(f"  Saved metadata.json ({(out_dir / 'metadata.json').stat().st_size / 1024:.0f} KB)")

    # Save matches_data.json
    print("Building match journey data...")
    match_data = build_match_data(df)
    with open(out_dir / "matches_data.json", "w") as f:
        json.dump(match_data, f, separators=(",", ":"))
    print(f"  Saved matches_data.json ({(out_dir / 'matches_data.json').stat().st_size / 1024:.0f} KB)")

    print("\n✅ Preprocessing complete!")
    print(f"   {len(df):,} events · {len(match_list)} matches · {len(MAP_CONFIG)} maps")


if __name__ == "__main__":
    main()
