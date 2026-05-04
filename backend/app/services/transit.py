"""
Transit scoring: distance to nearest subway stations + Google Maps API for commute times.
Falls back to haversine distance estimates when no API key is available.
"""
import math
import httpx
from typing import Optional, List, Dict, Tuple
from app.config import settings

# Major NYC subway stations with coordinates and lines served
NYC_SUBWAY_STATIONS = [
    {"name": "Times Sq-42 St", "lat": 40.7557, "lon": -73.9877, "lines": ["1","2","3","7","N","Q","R","W","A","C","E"]},
    {"name": "Grand Central-42 St", "lat": 40.7527, "lon": -73.9772, "lines": ["4","5","6","7","S"]},
    {"name": "Union Sq-14 St", "lat": 40.7353, "lon": -73.9903, "lines": ["4","5","6","L","N","Q","R","W"]},
    {"name": "Fulton St", "lat": 40.7093, "lon": -74.0076, "lines": ["A","C","2","3","4","5","J","Z"]},
    {"name": "Atlantic Av-Barcl", "lat": 40.6836, "lon": -73.9778, "lines": ["B","D","N","Q","R","2","3","4","5","LIRR"]},
    {"name": "Jay St-MetroTech", "lat": 40.6924, "lon": -73.9870, "lines": ["A","C","F","R"]},
    {"name": "Court Sq", "lat": 40.7474, "lon": -73.9454, "lines": ["E","G","M","7"]},
    {"name": "Jackson Hts-Roosevelt Av", "lat": 40.7465, "lon": -73.8913, "lines": ["E","F","M","R","7"]},
    {"name": "Flushing-Main St", "lat": 40.7596, "lon": -73.8300, "lines": ["7"]},
    {"name": "161 St-Yankee Stadium", "lat": 40.8277, "lon": -73.9261, "lines": ["4","B","D"]},
    {"name": "Pelham Bay Park", "lat": 40.8527, "lon": -73.8287, "lines": ["6"]},
    {"name": "Lorimer St", "lat": 40.7143, "lon": -73.9503, "lines": ["L","G"]},
    {"name": "Bedford Av", "lat": 40.7170, "lon": -73.9563, "lines": ["L"]},
    {"name": "Marcy Av", "lat": 40.7083, "lon": -73.9574, "lines": ["J","M","Z"]},
    {"name": "High St-Brooklyn Bridge", "lat": 40.6984, "lon": -73.9906, "lines": ["A","C"]},
    {"name": "Borough Hall", "lat": 40.6929, "lon": -73.9900, "lines": ["2","3","4","5","R"]},
    {"name": "7 Av", "lat": 40.6766, "lon": -73.9723, "lines": ["B","Q"]},
    {"name": "Prospect Park", "lat": 40.6615, "lon": -73.9624, "lines": ["B","Q","S"]},
    {"name": "Astoria-Ditmars Blvd", "lat": 40.7754, "lon": -73.9125, "lines": ["N","W"]},
    {"name": "36 Av", "lat": 40.7567, "lon": -73.9298, "lines": ["N","W"]},
    {"name": "Grove St (JC)", "lat": 40.7193, "lon": -74.0432, "lines": ["PATH"]},
    {"name": "Journal Sq (JC)", "lat": 40.7327, "lon": -74.0630, "lines": ["PATH"]},
    {"name": "Newport (JC)", "lat": 40.7270, "lon": -74.0339, "lines": ["PATH"]},
    {"name": "Hoboken Terminal", "lat": 40.7357, "lon": -74.0298, "lines": ["PATH","NJT"]},
    {"name": "14 St", "lat": 40.7401, "lon": -74.0001, "lines": ["A","C","E","L"]},
    {"name": "W 4 St", "lat": 40.7323, "lon": -74.0002, "lines": ["A","C","E","B","D","F","M"]},
    {"name": "Canal St", "lat": 40.7196, "lon": -74.0050, "lines": ["A","C","E","1","N","Q","R","W","J","Z","6"]},
    {"name": "96 St", "lat": 40.7842, "lon": -73.9479, "lines": ["4","5","6"]},
    {"name": "86 St (UES)", "lat": 40.7793, "lon": -73.9557, "lines": ["4","5","6"]},
    {"name": "72 St (UWS)", "lat": 40.7756, "lon": -73.9816, "lines": ["1","2","3"]},
    {"name": "Cathedral Pkwy-110 St", "lat": 40.8026, "lon": -73.9646, "lines": ["B","C"]},
    {"name": "125 St", "lat": 40.8081, "lon": -73.9458, "lines": ["4","5","6"]},
    {"name": "145 St", "lat": 40.8243, "lon": -73.9443, "lines": ["3"]},
    {"name": "Smith-9 Sts", "lat": 40.6736, "lon": -73.9961, "lines": ["F","G"]},
    {"name": "Bergen St", "lat": 40.6806, "lon": -73.9908, "lines": ["F","G"]},
    {"name": "Carroll St", "lat": 40.6801, "lon": -73.9951, "lines": ["F","G"]},
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def nearest_stations(lat: float, lon: float, count: int = 3) -> List[Dict]:
    with_dist = [(haversine_km(lat, lon, s["lat"], s["lon"]), s) for s in NYC_SUBWAY_STATIONS]
    with_dist.sort(key=lambda x: x[0])
    return [{"name": s["name"], "lines": s["lines"], "distance_km": round(d, 3)} for d, s in with_dist[:count]]


def transit_score_from_stations(nearest: List[Dict]) -> int:
    """Score 0-100 based on closest station distance and number of lines."""
    if not nearest:
        return 0
    closest_km = nearest[0]["distance_km"]
    if closest_km < 0.2:
        base = 95
    elif closest_km < 0.4:
        base = 80
    elif closest_km < 0.7:
        base = 65
    elif closest_km < 1.0:
        base = 50
    elif closest_km < 1.5:
        base = 35
    else:
        base = 20
    line_bonus = min(10, len(nearest[0]["lines"]) * 2)
    return min(100, base + line_bonus)


async def get_commute_minutes(origin_lat: float, origin_lon: float, dest_address: str) -> Optional[int]:
    """Get commute time via Google Maps Distance Matrix API, or estimate from distance."""
    if settings.GOOGLE_MAPS_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/distancematrix/json",
                    params={
                        "origins": f"{origin_lat},{origin_lon}",
                        "destinations": dest_address,
                        "mode": "transit",
                        "key": settings.GOOGLE_MAPS_API_KEY,
                    },
                    timeout=10,
                )
                data = resp.json()
                rows = data.get("rows", [])
                if rows and rows[0].get("elements"):
                    elem = rows[0]["elements"][0]
                    if elem.get("status") == "OK":
                        return elem["duration"]["value"] // 60
        except Exception:
            pass

    # Rough estimate: assume destination is in Midtown (~40.754, -73.984)
    dest_lat, dest_lon = 40.754, -73.984
    dist_km = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
    # subway avg speed ~30 km/h including stops + 5 min walk each end
    minutes = int((dist_km / 30) * 60) + 10
    return min(minutes, 90)
