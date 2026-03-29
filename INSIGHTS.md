# Player Insights — LILA BLACK (Feb 10–14, 2026)

> Generated using the Player Journey Visualizer · 89,104 events · 796 matches · 3 maps

---

## Insight 1: Ambrose Valley Has a Severe Traffic Dead Zone in the Northwest

### What caught my eye

When I enabled the **Traffic heatmap** on Ambrose Valley, the northwest corner of the map was almost entirely dark while the center-south region lit up intensely. I ran a quadrant analysis to confirm: the map has **21.7× more player movement in the busiest zone than the quietest**.

### The data

Traffic events (Position + BotPosition) broken into a 4×4 quadrant grid on Ambrose Valley:

|   | West | Center-West | Center-East | East |
|---|---|---|---|---|
| **North** | 951 | 2,355 | 2,097 | 873 |
| **Center-North** | 2,915 | 4,707 | 4,153 | 2,251 |
| **Center-South** | **294** | **6,366** | **6,338** | 2,671 |
| **South** | 3,326 | 3,691 | 5,209 | 557 |

- Most visited cell: Center-South/Center-West — **6,366 events**
- Least visited cell: Center-South/West — **294 events** (21.7× lower)
- The northwest strip is consistently under 1,000 events across the full 5-day dataset

The visualizer shows this as near-zero traffic in approximately the top-left 20% of the minimap.

### Why a level designer should care

This is a classic **map funnel problem**. Players are self-organizing into a corridor through the center-south, likely because:
1. The storm's directional push (centroid at px≈443, py≈520) channels movement toward the center
2. High-density loot is concentrated in the same center-south zone (loot centroid: 414, 564)

**Actionable items:**
- Add a high-value loot drop or extraction point in the northwest to incentivize players to spread out
- Introduce a terrain chokepoint on the center corridor to reduce the "highway" effect
- **Metrics to track:** Quadrant entropy (ideal = uniform distribution); % of matches where at least one player enters the northwest before the storm closes

---

## Insight 2: Loot and Kill Zones Are Dangerously Co-Located — No Safe Looting Exists

### What caught my eye

Using the **Loot Density** and **Kill Zones** heatmaps simultaneously, I noticed the overlays were nearly identical across all three maps. I expected players to loot in quieter areas and fight later — but the data shows they're dying within meters of where they pick things up.

### The data

Centroid separation between loot events and kill events (in minimap pixels, on a 1024px canvas):

| Map | Loot Centroid (px, py) | Kill Centroid (px, py) | Separation |
|---|---|---|---|
| **Ambrose Valley** | (414, 564) | (418, 540) | **24px** (~2.4% of map width) |
| **Grand Rift** | (535, 484) | (498, 505) | **43px** (~4.2% of map width) |
| **Lockdown** | (482, 434) | (493, 471) | **39px** (~3.8% of map width) |

Additionally, human players loot at a very high rate: **0.252 loot pickups per movement event** (1 loot every ~4 position samples). Given sampling is every ~5ms, players are encountering loot constantly throughout movement.

The kill-to-loot ratio across maps:
- Ambrose Valley: **4.4 loots per kill**
- Grand Rift: **3.7 loots per kill**
- Lockdown: **3.5 loots per kill** (closest to a PvP focus)

### Why a level designer should care

When players can't loot without immediately getting into combat, two problems emerge:
1. **Gear imbalance** — early kills are fought under-equipped, reducing skill expression
2. **Risk vs. reward collapse** — the loot reward doesn't feel distinct from the combat risk; it erodes the extraction fantasy

**Actionable items:**
- Introduce at least one **"safe loot zone"** per map with limited sight lines and no direct storm path
- Separate high-value loot spawns (currently at the kill centroid) from extraction routes
- Consider a **conflict delay mechanic**: an early-game "safe window" before high-value loot becomes contested
- **Metrics to track:** Average loot count at time of first death; survival time of players who looted in off-center zones vs. center zones

---

## Insight 3: The Storm Is Catching Players Throughout the Entire Match — Not Just Late-Game

### What caught my eye

The **Storm Deaths** filter placed 39 markers across all maps. I expected them to cluster late in matches (when the storm closes). Instead, the timeline panel showed storm deaths spread across **10s to 346s** of game time — spanning almost the full session window.

### The data

Storm deaths distribution:

| Map | Storm Deaths | ts_rel min | ts_rel max | Centroid (px, py) |
|---|---|---|---|---|
| **Ambrose Valley** | 17 | 10,704 ms | 346,423 ms | (443, 520) |
| **Grand Rift** | 5 | varied | varied | (518, 506) |
| **Lockdown** | 17 | varied | varied | (562, 467) |

Storm death rate per match:
- Ambrose Valley: 17 storm deaths / 566 matches = **3% of matches** produce a storm death
- Lockdown: 17 / 171 = **9.9%** — storm pressure is nearly 3× higher on Lockdown

The Lockdown storm centroid (562, 467) is noticeably east of center, suggesting the storm's sweep direction has a right-side bias on that map.

**The early storm deaths** (ts_rel < 30,000ms) are the most alarming. Players are dying to the storm in what should still be the looting/positioning phase. This means the storm's **initial position or starting velocity is too aggressive** on some server instances.

**Actionable items:**
- On **Lockdown**, review the storm's starting edge — the east-heavy centroid and 9.9% death rate suggest players spawning on the east side have near-zero reaction time
- Add a **30-second grace period** before storm damage begins, with audio/visual warning progression
- Evaluate whether storm paths across all three maps are generating fair "run distance" for players at all spawns
- **Metrics to track:** Storm death rate by spawn quadrant; average distance from storm death location to nearest extraction; player session drop-off rate on Lockdown (frustrated exits after early storm deaths)

---

## Summary: Three Levers for the Level Design Team

| Priority | Issue | Map | Impact |
|---|---|---|---|
| 🔴 High | Northwest dead zone (21.7× traffic imbalance) | Ambrose Valley | Map usage, player spread, engagement variety |
| 🟡 Medium | Loot + kill zones fully overlapping | All maps | Gear parity, risk/reward, extraction fantasy |
| 🟠 Medium | Early-game storm deaths (Lockdown 9.9%/match) | Lockdown especially | Fairness, frustration, session retention |
