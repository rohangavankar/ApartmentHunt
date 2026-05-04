from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.database import get_db
from app.models.listing import Listing
from app.services.chat import chat_with_claude, build_listing_context
from app.limiter import limiter

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_price: Optional[int] = None
    borough: Optional[str] = None


@router.post("")
@limiter.limit("5/minute;50/day")
async def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db)):
    # Pull relevant listings for context
    q = db.query(Listing).filter(Listing.is_active == True)
    if body.max_price:
        q = q.filter(Listing.price <= body.max_price)
    if body.borough:
        q = q.filter(Listing.borough == body.borough)
    sample = q.order_by(Listing.price).limit(10).all()

    listing_dicts = [
        {
            "bedrooms": l.bedrooms,
            "neighborhood": l.neighborhood,
            "borough": l.borough,
            "price": l.price,
            "sqft": l.sqft,
            "address": l.address,
        }
        for l in sample
    ]
    context = build_listing_context(listing_dicts)
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    reply = await chat_with_claude(messages, context)
    return {"reply": reply}
