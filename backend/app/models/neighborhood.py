import uuid
from sqlalchemy import Column, String, Integer, Float, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Neighborhood(Base):
    __tablename__ = "neighborhoods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True, index=True)
    borough = Column(String, nullable=False, index=True)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    avg_rent_studio = Column(Integer, nullable=True)
    avg_rent_1br = Column(Integer, nullable=True)
    avg_rent_2br = Column(Integer, nullable=True)

    transit_score = Column(Integer, nullable=True)   # 0-100
    walk_score = Column(Integer, nullable=True)       # 0-100
    bike_score = Column(Integer, nullable=True)

    subway_lines = Column(JSON, default=list)   # ["A", "C", "E", "1", "2", "3"]
    nearby_stations = Column(JSON, default=list)  # [{"name": "14 St", "lines": ["A","C"]}]

    description = Column(Text, nullable=True)
    vibe_tags = Column(JSON, default=list)  # ["trendy", "family-friendly", "nightlife"]
