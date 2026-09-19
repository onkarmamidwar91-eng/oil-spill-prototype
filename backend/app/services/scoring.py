"""
Suspect scoring.

Combines the drift-origin spatial match, timing match, AIS reporting gaps
(a classic dark-vessel indicator) and vessel type into a single 0-100
score, mirroring the "Suspect Scoring" stage in the technical approach
slide. Weights here are illustrative and would be calibrated against
labeled incidents in the real system.
"""
from app.models import VesselMatch

TANKER_TYPES = {"Crude Oil Tanker", "Product Tanker", "Chemical Tanker"}

DIST_WEIGHT = 0.45
TIME_WEIGHT = 0.25
GAP_BONUS = 18
TYPE_FACTOR_TANKER = 1.0
TYPE_FACTOR_OTHER = 0.55


def _clip(v, lo=0, hi=100):
    return max(lo, min(hi, v))


def score_matches(matches: list) -> list:
    results = []
    for m in matches:
        v = m["vessel"]
        distance_km = m["distance_km"]
        time_delta_min = m["time_delta_min"]

        distance_score = _clip(100 - distance_km * 9)
        time_score = _clip(100 - time_delta_min * 1.4)
        gap_bonus = GAP_BONUS if v.get("gap_flag") else 0
        type_factor = TYPE_FACTOR_TANKER if v["type"] in TANKER_TYPES else TYPE_FACTOR_OTHER

        raw = DIST_WEIGHT * distance_score + TIME_WEIGHT * time_score + gap_bonus
        suspect_score = round(_clip(raw * type_factor), 1)

        results.append(VesselMatch(
            mmsi=v["mmsi"],
            name=v["name"],
            flag=v["flag"],
            type=v["type"],
            gap_flag=v.get("gap_flag", False),
            notes=v.get("notes", ""),
            distance_km=distance_km,
            time_delta_min=time_delta_min,
            suspect_score=suspect_score,
            track=v["track"],
        ))

    results.sort(key=lambda r: r.suspect_score, reverse=True)
    return results
