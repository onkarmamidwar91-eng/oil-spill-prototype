"""
Simplified reverse-drift trajectory model.

The real system runs OpenDrift's OceanDrift module forced by CMEMS ocean
currents and ERA5 winds, integrated backward from the detected slick to
recover a probable spill origin and time. This module reproduces the same
*shape* of computation — vector-field advection with a windage term,
stepped backward in time, run as a small perturbed ensemble to express
uncertainty — using the scenario's recorded wind/current summary instead
of gridded reanalysis data.
"""
import math
from datetime import datetime, timedelta, timezone
from typing import List
from app.models import DriftResult, DriftPoint, LatLon

KM_PER_DEG_LAT = 111.0
KT_TO_KMH = 1.852
WINDAGE_FACTOR = 0.03  # fraction of wind speed added to surface current drift
STEP_MIN = 10
TOTAL_BACK_MIN = 90


def _vector_km(speed_kt: float, bearing_deg: float) -> tuple[float, float]:
    """Return (east_km_per_h, north_km_per_h) for a speed/bearing pair."""
    speed_kmh = speed_kt * KT_TO_KMH
    rad = math.radians(bearing_deg)
    return speed_kmh * math.sin(rad), speed_kmh * math.cos(rad)


def _step_back(lat: float, lon: float, east_kmh: float, north_kmh: float, hours: float):
    d_north_km = -north_kmh * hours
    d_east_km = -east_kmh * hours
    new_lat = lat + d_north_km / KM_PER_DEG_LAT
    new_lon = lon + d_east_km / (KM_PER_DEG_LAT * math.cos(math.radians(lat)))
    return new_lat, new_lon


def _run_track(start_lat, start_lon, start_time, wind_kt, wind_dir, current_kt, current_dir) -> List[DriftPoint]:
    ce, cn = _vector_km(current_kt, current_dir)
    we, wn = _vector_km(wind_kt, wind_dir)
    east = ce + WINDAGE_FACTOR * we
    north = cn + WINDAGE_FACTOR * wn

    points = [DriftPoint(t=start_time.isoformat().replace("+00:00", "Z"), lat=round(start_lat, 5), lon=round(start_lon, 5))]
    lat, lon = start_lat, start_lon
    t = start_time
    steps = TOTAL_BACK_MIN // STEP_MIN
    for _ in range(steps):
        lat, lon = _step_back(lat, lon, east, north, STEP_MIN / 60)
        t = t - timedelta(minutes=STEP_MIN)
        points.append(DriftPoint(t=t.isoformat().replace("+00:00", "Z"), lat=round(lat, 5), lon=round(lon, 5)))
    return points


def compute_reverse_drift(scenario: dict) -> DriftResult:
    env = scenario["environment"]
    slick = scenario["slick"]
    start_lat, start_lon = slick["centroid"]["lat"], slick["centroid"]["lon"]
    start_time = datetime.fromisoformat(scenario["detected_at"].replace("Z", "+00:00"))

    best = _run_track(
        start_lat, start_lon, start_time,
        env["wind_kt"], env["wind_dir_deg"],
        env["current_kt"], env["current_dir_deg"],
    )

    # Small perturbation ensemble to express uncertainty in wind/current direction & speed
    ensemble = []
    perturbations = [
        (-20, 0.8), (-10, 0.9), (10, 1.1), (20, 1.2), (0, 1.0),
    ]
    for dir_off, speed_scale in perturbations:
        track = _run_track(
            start_lat, start_lon, start_time,
            env["wind_kt"] * speed_scale, env["wind_dir_deg"] + dir_off,
            env["current_kt"] * speed_scale, env["current_dir_deg"] + dir_off,
        )
        ensemble.append(track)

    origin_point = best[-1]
    window_start = best[int(len(best) * 0.6)].t
    window_end = best[-1].t

    return DriftResult(
        best_estimate=best,
        ensemble=ensemble,
        origin_estimate=LatLon(lat=origin_point.lat, lon=origin_point.lon),
        origin_time_window=[window_end, window_start],
    )
