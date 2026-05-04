from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class ListingOut(BaseModel):
    id: UUID
    source: str
    title: str
    address: str
    neighborhood: str
    borough: str
    city: str
    state: str
    zip_code: Optional[str]
    lat: float
    lon: float
    price: int
    bedrooms: float
    bathrooms: Optional[float]
    sqft: Optional[int]
    listing_url: Optional[str]
    images: List[str]
    amenities: List[str]
    description: Optional[str]
    available_date: Optional[date]
    transit_score: Optional[int]
    walk_score: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ListingFilters(BaseModel):
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_bedrooms: Optional[float] = None
    max_bedrooms: Optional[float] = None
    boroughs: Optional[List[str]] = None
    neighborhoods: Optional[List[str]] = None
    amenities: Optional[List[str]] = None
    limit: int = 100
    offset: int = 0
