import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)  # user-defined label, e.g. "1BR in Brooklyn"
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)  # E.164 format for SMS

    # Filter criteria
    min_price = Column(Integer, nullable=True)
    max_price = Column(Integer, nullable=True)
    min_bedrooms = Column(Float, nullable=True)
    max_bedrooms = Column(Float, nullable=True)
    boroughs = Column(JSON, default=list)       # ["Manhattan", "Brooklyn", ...]
    neighborhoods = Column(JSON, default=list)  # ["Williamsburg", "Astoria", ...]
    required_amenities = Column(JSON, default=list)

    # Commute filter
    work_address = Column(String, nullable=True)
    max_commute_minutes = Column(Integer, nullable=True)

    # State
    is_active = Column(Boolean, default=True)
    last_checked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    channel = Column(String, nullable=False)  # email, sms
    status = Column(String, nullable=False)   # sent, failed
