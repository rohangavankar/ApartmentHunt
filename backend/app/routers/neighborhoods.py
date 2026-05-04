from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.neighborhood import Neighborhood
from app.models.listing import Listing
from app.schemas.neighborhood import NeighborhoodOut, NeighborhoodRecommendRequest, NeighborhoodScore
from app.services.transit import get_commute_minutes, haversine_km

router = APIRouter(prefix="/neighborhoods", tags=["neighborhoods"])


@router.get("", response_model=List[NeighborhoodOut])
def list_neighborhoods(db: Session = Depends(get_db)):
    return db.query(Neighborhood).order_by(Neighborhood.borough, Neighborhood.name).all()


@router.post("/recommend", response_model=List[NeighborhoodScore])
async def recommend_neighborhoods(body: NeighborhoodRecommendRequest, db: Session = Depends(get_db)):
    neighborhoods = db.query(Neighborhood).all()
    results = []

    for nbhd in neighborhoods:
        # Budget filter
        if body.max_budget and body.bedrooms is not None:
            if body.bedrooms == 0:
                avg = nbhd.avg_rent_studio
            elif body.bedrooms <= 1:
                avg = nbhd.avg_rent_1br
            else:
                avg = nbhd.avg_rent_2br
            if avg and avg > body.max_budget * 1.15:
                continue

        commute = await get_commute_minutes(nbhd.lat, nbhd.lon, body.work_address)
        if body.max_commute_minutes and commute and commute > body.max_commute_minutes:
            continue

        score, breakdown = _score_neighborhood(nbhd, commute, body)
        active_count = db.query(Listing).filter(
            Listing.neighborhood == nbhd.name, Listing.is_active == True
        ).count()

        commute_desc = _commute_description(commute)
        results.append(
            NeighborhoodScore(
                neighborhood=NeighborhoodOut.model_validate(nbhd),
                commute_minutes=commute,
                commute_description=commute_desc,
                score=score,
                score_breakdown=breakdown,
                active_listings=active_count,
            )
        )

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:10]


def _score_neighborhood(nbhd: Neighborhood, commute: int, req: NeighborhoodRecommendRequest) -> tuple:
    breakdown = {}

    # Commute score (0-40 pts)
    if commute:
        if commute <= 20:
            breakdown["commute"] = 40
        elif commute <= 30:
            breakdown["commute"] = 35
        elif commute <= 45:
            breakdown["commute"] = 25
        elif commute <= 60:
            breakdown["commute"] = 15
        else:
            breakdown["commute"] = 5
    else:
        breakdown["commute"] = 20

    # Transit score (0-25 pts)
    ts = nbhd.transit_score or 50
    breakdown["transit"] = int(ts / 4)

    # Budget fit (0-20 pts)
    if req.max_budget:
        avg = nbhd.avg_rent_1br or nbhd.avg_rent_studio or 3000
        ratio = avg / req.max_budget
        if ratio <= 0.7:
            breakdown["budget"] = 20
        elif ratio <= 0.85:
            breakdown["budget"] = 15
        elif ratio <= 1.0:
            breakdown["budget"] = 10
        elif ratio <= 1.1:
            breakdown["budget"] = 5
        else:
            breakdown["budget"] = 0
    else:
        breakdown["budget"] = 10

    # Vibe match (0-15 pts)
    vibe_match = sum(1 for v in req.vibe_preferences if v in (nbhd.vibe_tags or []))
    breakdown["vibe"] = min(15, vibe_match * 5)

    total = sum(breakdown.values())
    return round(total, 1), breakdown


def _commute_description(minutes: int) -> str:
    if not minutes:
        return "Commute time unavailable"
    if minutes <= 15:
        return "Very short commute"
    if minutes <= 25:
        return "Short commute"
    if minutes <= 40:
        return "Moderate commute"
    if minutes <= 55:
        return "Longer commute"
    return "Long commute"
