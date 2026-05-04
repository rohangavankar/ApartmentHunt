import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String, unique=True, nullable=True, index=True)
    source = Column(String, nullable=False, default="seed")  # streeteasy, seed

    title = Column(String, nullable=False)
    address = Column(String, nullable=False)
    neighborhood = Column(String, nullable=False, index=True)
    borough = Column(String, nullable=False, index=True)  # Manhattan, Brooklyn, Queens, Bronx, Jersey City
    city = Column(String, nullable=False, default="New York")
    state = Column(String, nullable=False, default="NY")
    zip_code = Column(String, nullable=True)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    price = Column(Integer, nullable=False, index=True)  # monthly rent in USD
    bedrooms = Column(Float, nullable=False, index=True)  # 0 = studio
    bathrooms = Column(Float, nullable=True)
    sqft = Column(Integer, nullable=True)

    listing_url = Column(String, nullable=True)
    images = Column(JSON, default=list)  # list of image URLs
    amenities = Column(JSON, default=list)  # ["dishwasher", "gym", "doorman", ...]
    description = Column(Text, nullable=True)

    available_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    transit_score = Column(Integer, nullable=True)  # 0-100
    walk_score = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source_data = Column(JSON, nullable=True)  # raw API payload
