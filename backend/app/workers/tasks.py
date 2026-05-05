import logging
from datetime import datetime
from app.workers.celery_app import celery
from app.database import SessionLocal
from app.models.alert import Alert, AlertHistory
from app.models.listing import Listing
from app.services.email_service import send_alert_email

logger = logging.getLogger(__name__)


@celery.task(name="app.workers.tasks.check_and_send_alerts")
def check_and_send_alerts():
    db = SessionLocal()
    try:
        alerts = db.query(Alert).filter(Alert.is_active == True).all()
        logger.info(f"[alerts] checking {len(alerts)} alert(s)")
        for alert in alerts:
            _process_alert(db, alert)
        db.commit()
    finally:
        db.close()


def _process_alert(db, alert: Alert):
    q = db.query(Listing).filter(Listing.is_active == True)

    if alert.min_price:
        q = q.filter(Listing.price >= alert.min_price)
    if alert.max_price:
        q = q.filter(Listing.price <= alert.max_price)
    if alert.min_bedrooms is not None:
        q = q.filter(Listing.bedrooms >= alert.min_bedrooms)
    if alert.max_bedrooms is not None:
        q = q.filter(Listing.bedrooms <= alert.max_bedrooms)
    if alert.boroughs:
        q = q.filter(Listing.borough.in_(alert.boroughs))
    if alert.neighborhoods:
        q = q.filter(Listing.neighborhood.in_(alert.neighborhoods))

    # Only listings we haven't already sent for this alert
    sent_ids = {
        str(h.listing_id)
        for h in db.query(AlertHistory.listing_id).filter(AlertHistory.alert_id == alert.id).all()
    }
    # Only look at listings newer than last check
    if alert.last_checked:
        q = q.filter(Listing.created_at > alert.last_checked)

    all_matches = q.all()
    new_listings = [l for l in all_matches if str(l.id) not in sent_ids]
    logger.info(f"[alerts] '{alert.name}': {len(all_matches)} new since last check, {len(new_listings)} unsent")

    if not new_listings:
        alert.last_checked = datetime.utcnow()
        return

    listing_dicts = [
        {
            "id": str(l.id),
            "title": l.title,
            "address": l.address,
            "neighborhood": l.neighborhood,
            "price": l.price,
            "bedrooms": l.bedrooms,
            "listing_url": l.listing_url,
        }
        for l in new_listings
    ]

    # Send email
    success = send_alert_email(alert.email, alert.name, listing_dicts)
    channel = "email"
    status = "sent" if success else "failed"
    for l in new_listings:
        db.add(AlertHistory(alert_id=alert.id, listing_id=l.id, channel=channel, status=status))

    alert.last_checked = datetime.utcnow()


@celery.task(name="app.workers.tasks.scrape_streeteasy")
def scrape_streeteasy():
    """Scrape StreetEasy and upsert new listings, then fire alert checks."""
    from app.services.streeteasy import scrape_streeteasy as _scrape, AREA_MAP

    # Default search: popular Manhattan + Brooklyn neighborhoods, $2k–$7k, 0–3 beds.
    # Edit area names here — keys must be in AREA_MAP.
    area_names = [
        "Williamsburg", "Greenpoint", "Bushwick", "East Williamsburg",
        "Bedford-Stuyvesant", "Crown Heights", "Prospect Heights",
        "Park Slope", "Gowanus", "Carroll Gardens", "Cobble Hill",
        "Fort Greene", "Clinton Hill", "DUMBO", "Brooklyn Heights",
        "Boerum Hill", "Downtown Brooklyn", "Red Hook",
        "Long Island City", "Hunters Point", "Astoria",
        "Hell's Kitchen", "Chelsea", "East Village", "Lower East Side",
        "Upper East Side", "Upper West Side",
    ]
    area_codes = [AREA_MAP[n] for n in area_names if n in AREA_MAP]
    area_codes = list(set(area_codes))

    listings = _scrape(
        area_codes=area_codes,
        min_price=2000,
        max_price=7000,
        min_beds=0,
        max_beds=3,
        max_pages=5,
    )

    if not listings:
        return

    db = SessionLocal()
    try:
        new_count = 0
        for data in listings:
            ext_id = data.get("external_id")
            if not ext_id:
                continue
            exists = db.query(Listing).filter(Listing.external_id == ext_id).first()
            if not exists:
                listing = Listing(**{k: v for k, v in data.items() if k != "external_id"})
                listing.external_id = ext_id
                db.add(listing)
                new_count += 1
        db.commit()
        print(f"[streeteasy] Added {new_count} new listings")
    finally:
        db.close()

    if new_count > 0:
        check_and_send_alerts.delay()


