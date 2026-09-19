"""
Simulated AI slick detection.

In the real system this stage runs a U-Net / DeepLabV3+ segmentation model
over calibrated Sentinel-1 SAR backscatter tiles. Here we deterministically
synthesize a plausible slick polygon from the scenario's recorded
centroid/length/orientation so the rest of the pipeline (drift, AIS
matching, scoring) can be demoed end-to-end without a trained model or
real satellite tiles.
"""
import math
from app.models import SlickPolygon, LatLon

KM_PER_DEG_LAT = 111.0


def _km_to_deg_lon(km: float, lat: float) -> float:
    return km / (KM_PER_DEG_LAT * math.cos(math.radians(lat)))


def _km_to_deg_lat(km: float) -> float:
    return km / KM_PER_DEG_LAT


def build_slick_polygon(scenario: dict) -> SlickPolygon:
    slick = scenario["slick"]
    centroid = slick["centroid"]
    length_km = slick["length_km"]
    orientation = math.radians(slick["orientation_deg"])
    width_km = max(0.8, slick["area_km2"] / length_km)

    # Generate an elongated, slightly irregular ellipse to stand in for a
    # real segmentation mask outline.
    n_points = 24
    poly = []
    for i in range(n_points):
        theta = 2 * math.pi * i / n_points
        # slight irregularity so it doesn't look like a perfect ellipse
        jitter = 1 + 0.08 * math.sin(theta * 3 + 1.7)
        rx = (length_km / 2) * jitter
        ry = (width_km / 2) * jitter
        x = rx * math.cos(theta)
        y = ry * math.sin(theta)
        # rotate by orientation
        xr = x * math.cos(orientation) - y * math.sin(orientation)
        yr = x * math.sin(orientation) + y * math.cos(orientation)
        lat = centroid["lat"] + _km_to_deg_lat(yr)
        lon = centroid["lon"] + _km_to_deg_lon(xr, centroid["lat"])
        poly.append([round(lat, 5), round(lon, 5)])

    return SlickPolygon(
        centroid=LatLon(**centroid),
        confidence=slick["confidence"],
        lookalike_risk=slick["lookalike_risk"],
        area_km2=slick["area_km2"],
        length_km=length_km,
        polygon=poly,
        notes=slick["notes"],
    )
