from pydantic import BaseModel
from typing import List, Optional


class LatLon(BaseModel):
    lat: float
    lon: float


class SlickPolygon(BaseModel):
    centroid: LatLon
    confidence: float
    lookalike_risk: str
    area_km2: float
    length_km: float
    polygon: List[List[float]]  # [[lat, lon], ...]
    notes: str


class DriftPoint(BaseModel):
    t: str
    lat: float
    lon: float


class DriftResult(BaseModel):
    best_estimate: List[DriftPoint]
    ensemble: List[List[DriftPoint]]
    origin_estimate: LatLon
    origin_time_window: List[str]


class VesselMatch(BaseModel):
    mmsi: str
    name: str
    flag: str
    type: str
    gap_flag: bool
    notes: str
    distance_km: float
    time_delta_min: float
    suspect_score: float
    track: List[dict]


class PipelineResult(BaseModel):
    scenario_id: str
    label: str
    detected_at: str
    slick: SlickPolygon
    drift: DriftResult
    vessels: List[VesselMatch]
