from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID


class AlertCreate(BaseModel):
    name: str
    email: str
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_bedrooms: Optional[float] = None
    max_bedrooms: Optional[float] = None
    boroughs: List[str] = []
    neighborhoods: List[str] = []
    required_amenities: List[str] = []
    work_address: Optional[str] = None
    max_commute_minutes: Optional[int] = None


class AlertOut(BaseModel):
    id: UUID
    name: str
    email: str
    min_price: Optional[int]
    max_price: Optional[int]
    min_bedrooms: Optional[float]
    max_bedrooms: Optional[float]
    boroughs: List[str]
    neighborhoods: List[str]
    required_amenities: List[str]
    work_address: Optional[str]
    max_commute_minutes: Optional[int]
    is_active: bool
    last_checked: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("last_checked", "created_at")
    def serialize_dt(self, dt: Optional[datetime]) -> Optional[str]:
        if dt is None:
            return None
        # Append Z so JavaScript treats it as UTC and converts to local time
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


class AlertUpdate(BaseModel):
    is_active: Optional[bool] = None
    max_price: Optional[int] = None
    min_price: Optional[int] = None
