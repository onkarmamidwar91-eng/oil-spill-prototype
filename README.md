# Oil Spill Detection & Ship Tracing — Prototype

**SIH 2026 · PS ID SIH26143 · Theme: Disaster Management · Team: Code Crafters**

Leveraging satellite imagery to determine oil spills at sea, correlated with AIS
data, to identify the vessel responsible for the spill.

This is a **working prototype** that demonstrates the full pipeline end-to-end —
**Detect → Trace → Attribute → Score** — using simulated SAR and AIS data. It is
built so the real components (a trained segmentation model, OpenDrift + live
reanalysis, a live AIS feed) can be dropped in behind the same service
interfaces without changing the API contract or the frontend.

## What's simulated vs. real

| Stage | In this prototype | In production |
|---|---|---|
| Slick detection | Deterministic polygon generated from scenario metadata (`backend/app/services/detection.py`) | U-Net / DeepLabV3+ over calibrated Sentinel-1 SAR tiles |
| Reverse drift | Simplified vector-field backward advection with a windage term and a 5-member perturbation ensemble (`services/drift.py`) | OpenDrift `OceanDrift`, forced by CMEMS currents + ERA5 winds |
| AIS matching | In-memory space-time nearest-point search over mock vessel tracks (`services/ais_matching.py`) | PostGIS `ST_DWithin` / temporal-range query over a live AIS feed |
| Suspect scoring | Weighted 0–100 score from distance, timing, AIS gaps, vessel type (`services/scoring.py`) | Same approach, weights calibrated against labeled incidents |

The physics and matching *logic* is real (haversine distance, vector advection,
space-time nearest neighbor, weighted scoring) — only the input data (SAR
tiles, ocean/wind reanalysis grids, live AIS) is mocked, so the pipeline
produces internally consistent, explainable results end to end.

## Architecture

```
frontend/  React + Vite dashboard — scenario picker, pipeline stepper,
           Leaflet map (slick polygon, drift corridor, vessel tracks),
           suspect ranking panel, evidence report drawer

backend/   FastAPI service
  app/services/   detection.py, drift.py, ais_matching.py, scoring.py
  app/routers/     pipeline.py — GET /api/scenarios
                                 GET /api/scenario/{id}/pipeline
                                 GET /api/scenario/{id}/report
  app/mock_data/   scenarios.json, vessels.json
```

## Run locally

### Option A — Docker Compose

```bash
docker compose up --build
```

- Backend: http://localhost:8000/docs
- Frontend: http://localhost:5173

### Option B — manually

**Backend**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:5173, pick a scenario, click **Run pipeline**.

## API

- `GET /api/scenarios` — list available demo scenarios
- `GET /api/scenario/{id}/pipeline` — run detect → trace → attribute → score, return full result
- `GET /api/scenario/{id}/report` — court-ready evidence summary (JSON)

Full interactive docs at `/docs` once the backend is running (Swagger UI).

## Swapping in real components

Each service module has a single entry function that returns the same
pydantic model regardless of what's behind it:

- `detection.build_slick_polygon(scenario) -> SlickPolygon`
- `drift.compute_reverse_drift(scenario) -> DriftResult`
- `ais_matching.match_vessels(vessels, drift) -> list`
- `scoring.score_matches(matches) -> list[VesselMatch]`

To go from prototype to production, replace the body of each function with a
call to the real model / OpenDrift run / PostGIS query — the router, response
schemas, and frontend do not need to change.

## Next steps for the full build

1. Train/fine-tune U-Net or DeepLabV3+ on labeled Sentinel-1 slick datasets
2. Stand up OpenDrift with live CMEMS + ERA5 forcing
3. Ingest a live AIS stream (e.g. via AISHub/Spire) into PostGIS
4. Replace `mock_data/*.json` with real scene ingestion from Copernicus Open
   Access Hub
5. Add authentication and audit logging for the evidence-report export (chain
   of custody for court use)
