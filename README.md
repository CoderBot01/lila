# LILA BLACK — Player Journey Visualizer

An internal analytics tool for Level Designers to understand player behavior across LILA BLACK's maps. Built for the LILA Games APM assignment.

🌐 Live → https://lila-orcin.vercel.app/

---

## 🚀 Overview

This tool enables deep analysis of player behavior across maps by combining:

* Spatial visualization (paths + heatmaps)
* Temporal analysis (match playback)
* Event intelligence (kills, loot, deaths)
* Automated insights (design-level signals)

---

## ✨ Features

* **Player paths** — Human vs bot movement visualization
* **Event markers** — Kills, deaths, loot, storm events
* **Heatmaps** — Density overlays (kills, traffic, loot, deaths)
* **Match playback** — Timeline scrubbing (0.5×–8×)
* **Filters** — Map, date, match-level filtering
* **Insights engine** — Combat density, loot efficiency, bot ratio
* **Story mode** — Actionable design insights per map

---

## 🧱 Tech stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Frontend  | React 18 + Vite + Tailwind CSS       |
| Rendering | HTML5 Canvas (multi-layer rendering) |
| Backend   | FastAPI (Python 3.11)                |
| Data      | Pandas + PyArrow → JSON              |
| Hosting   | Railway + Vercel                     |

---

## 📂 Repository structure

```bash
lila-viz/
├── backend/
├── frontend/
├── README.md
├── ARCHITECTURE.md
└── INSIGHTS.md
```

---

## 📚 Documentation

Detailed technical and product thinking is split into focused docs:

* 📐 **Architecture** → [`ARCHITECTURE.md`](./ARCHITECTURE.md)
  Covers system design, data flow, rendering strategy, and backend architecture

* 🧠 **Insights & Findings** → [`INSIGHTS.md`](./INSIGHTS.md)
  Key gameplay patterns, map-level learnings, and product reasoning

👉 These documents reflect **product thinking + system design depth**, not just implementation.

---

## 🧪 Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

* API → http://localhost:8000
* Docs → http://localhost:8000/docs

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

* App → http://localhost:5173

---

## ⚙️ Environment variables

### Frontend

```
VITE_API_URL=http://localhost:8000
```

### Production

```
VITE_API_URL=https://your-railway-app.up.railway.app
```

---

## 🚀 Deployment

### Backend (Railway)

* Use `/backend` as root
* Dockerfile is auto-detected
* **Do NOT set PORT manually**

---

### Frontend (Vercel)

* Root → `frontend`
* Build → `npm run build`
* Output → `dist`

---

## 📡 API

| Endpoint          | Description     |
| ----------------- | --------------- |
| `/api/health`     | Health check    |
| `/api/meta`       | Maps + insights |
| `/api/matches`    | Match list      |
| `/api/match/{id}` | Match details   |
| `/api/heatmap`    | Heatmap data    |

---

## 🎯 Why this matters (Product thinking)

This tool is not just visualization — it enables:

* Identifying **combat hotspots**
* Understanding **loot vs engagement imbalance**
* Detecting **bot-heavy vs player-heavy zones**
* Evaluating **map flow and pacing**

👉 Designed to help **level designers make better decisions faster**

---

## 👤 Author

Built for LILA Games APM Written Test — 2026
