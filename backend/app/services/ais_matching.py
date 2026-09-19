"""
AIS space-time matching.

The real system runs this as a PostGIS ST_DWithin / temporal-range query
against a live AIS feed. Here the same matching logic runs in-process
over the mock vessel track JSON: for each vessel we find the track point
closest in time to the estimated origin window, then score it against
the drift-derived origin point.
"""
import math
from datetime import datetime
from typing import List
from app.models import VesselMatch, DriftResult

EARTH_R_KM = 6371.0


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_R_KM * math.asin(math.sqrt(a))


def _closest_track_point(track: list, target_time: datetime):
    best, best_dt = None, None
    for pt in track:
        t = datetime.fromisoformat(pt["t"].replace("Z", "+00:00"))
        dt = abs((t - target_time).total_seconds())
        if best_dt is None or dt < best_dt:
            best, best_dt = pt, dt
    return best, best_dt / 60.0  # minutes


def match_vessels(vessels: List[dict], drift: DriftResult) -> List[dict]:
    origin = drift.origin_estimate
    window_end = datetime.fromisoformat(drift.origin_time_window[1].replace("Z", "+00:00"))

    matches = []
    for v in vessels:
        pt, time_delta_min = _closest_track_point(v["track"], window_end)
        distance_km = _haversine_km(origin.lat, origin.lon, pt["lat"], pt["lon"])
        matches.append({
            "vessel": v,
            "distance_km": round(distance_km, 2),
            "time_delta_min": round(time_delta_min, 1),
        })
    return matches
