from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
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


class AlertUpdate(BaseModel):
    is_active: Optional[bool] = None
    max_price: Optional[int] = None
    min_price: Optional[int] = None
