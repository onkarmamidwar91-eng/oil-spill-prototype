import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.services.detection import build_slick_polygon
from app.services.drift import compute_reverse_drift
from app.services.ais_matching import match_vessels
from app.services.scoring import score_matches
from app.models import PipelineResult

router = APIRouter(prefix="/api", tags=["pipeline"])

DATA_DIR = Path(__file__).resolve().parent.parent / "mock_data"
SCENARIOS = json.loads((DATA_DIR / "scenarios.json").read_text())["scenarios"]
VESSELS = json.loads((DATA_DIR / "vessels.json").read_text())["vessels"]

SCENARIO_INDEX = {s["id"]: s for s in SCENARIOS}


def _get_scenario(scenario_id: str) -> dict:
    scenario = SCENARIO_INDEX.get(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario_id}'")
    return scenario


@router.get("/scenarios")
def list_scenarios():
    return [
        {
            "id": s["id"],
            "label": s["label"],
            "satellite": s["satellite"],
            "detected_at": s["detected_at"],
            "region": s["region"],
        }
        for s in SCENARIOS
    ]


@router.get("/scenario/{scenario_id}/pipeline", response_model=PipelineResult)
def run_pipeline(scenario_id: str):
    scenario = _get_scenario(scenario_id)

    slick = build_slick_polygon(scenario)
    drift = compute_reverse_drift(scenario)
    matches = match_vessels(VESSELS, drift)
    vessels = score_matches(matches)

    return PipelineResult(
        scenario_id=scenario["id"],
        label=scenario["label"],
        detected_at=scenario["detected_at"],
        slick=slick,
        drift=drift,
        vessels=vessels,
    )


@router.get("/scenario/{scenario_id}/report")
def evidence_report(scenario_id: str):
    """Court-ready style evidence summary, combining every pipeline stage."""
    result = run_pipeline(scenario_id)
    top = result.vessels[0] if result.vessels else None
    return {
        "case_id": f"OSD-{scenario_id.upper()}",
        "scenario": result.label,
        "detection": {
            "satellite": SCENARIO_INDEX[scenario_id]["satellite"],
            "detected_at": result.detected_at,
            "confidence": result.slick.confidence,
            "lookalike_risk": result.slick.lookalike_risk,
            "area_km2": result.slick.area_km2,
            "length_km": result.slick.length_km,
        },
        "drift_origin_estimate": result.drift.origin_estimate.dict(),
        "origin_time_window": result.drift.origin_time_window,
        "primary_suspect": {
            "mmsi": top.mmsi,
            "name": top.name,
            "flag": top.flag,
            "type": top.type,
            "suspect_score": top.suspect_score,
            "distance_from_origin_km": top.distance_km,
            "time_delta_min": top.time_delta_min,
            "ais_gap_detected": top.gap_flag,
            "notes": top.notes,
        } if top else None,
        "all_ranked_vessels": [
            {"mmsi": v.mmsi, "name": v.name, "suspect_score": v.suspect_score}
            for v in result.vessels
        ],
        "disclaimer": "Prototype output generated from simulated SAR/AIS data for hackathon demonstration only. Not derived from live satellite or AIS feeds.",
    }
