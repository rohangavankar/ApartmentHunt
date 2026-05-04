from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.listing import Listing
from app.schemas.listing import ListingOut, ListingFilters

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=List[ListingOut])
def get_listings(
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    min_bedrooms: Optional[float] = Query(None),
    max_bedrooms: Optional[float] = Query(None),
    boroughs: Optional[str] = Query(None),       # comma-separated
    neighborhoods: Optional[str] = Query(None),  # comma-separated
    amenities: Optional[str] = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = db.query(Listing).filter(Listing.is_active == True)

    if min_price is not None:
        q = q.filter(Listing.price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.price <= max_price)
    if min_bedrooms is not None:
        q = q.filter(Listing.bedrooms >= min_bedrooms)
    if max_bedrooms is not None:
        q = q.filter(Listing.bedrooms <= max_bedrooms)
    if boroughs:
        borough_list = [b.strip() for b in boroughs.split(",")]
        q = q.filter(Listing.borough.in_(borough_list))
    if neighborhoods:
        nbhd_list = [n.strip() for n in neighborhoods.split(",")]
        q = q.filter(Listing.neighborhood.in_(nbhd_list))

    return q.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Listing).filter(Listing.is_active == True).count()
    from sqlalchemy import func
    avg = db.query(func.avg(Listing.price)).filter(Listing.is_active == True).scalar()
    boroughs = db.query(Listing.borough, func.count(Listing.id)).filter(
        Listing.is_active == True
    ).group_by(Listing.borough).all()
    return {
        "total_active": total,
        "avg_rent": int(avg) if avg else 0,
        "by_borough": {b: c for b, c in boroughs},
    }


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(listing_id: UUID, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing
