from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class NeighborhoodOut(BaseModel):
    id: UUID
    name: str
    borough: str
    lat: float
    lon: float
    avg_rent_studio: Optional[int]
    avg_rent_1br: Optional[int]
    avg_rent_2br: Optional[int]
    transit_score: Optional[int]
    walk_score: Optional[int]
    bike_score: Optional[int]
    subway_lines: List[str]
    nearby_stations: List[dict]
    description: Optional[str]
    vibe_tags: List[str]

    model_config = {"from_attributes": True}


class NeighborhoodRecommendRequest(BaseModel):
    work_address: str
    max_commute_minutes: int = 45
    max_budget: Optional[int] = None
    bedrooms: Optional[float] = None
    preferred_transit: str = "subway"  # subway, bus, walk, bike
    vibe_preferences: List[str] = []  # e.g. ["quiet", "parks", "restaurants"]


class NeighborhoodScore(BaseModel):
    neighborhood: NeighborhoodOut
    commute_minutes: Optional[int]
    commute_description: str
    score: float
    score_breakdown: dict
    active_listings: int
