"""
Standalone scrape job — runs outside Celery.
Used by GitHub Actions to scrape StreetEasy and insert into the DB.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal, init_db
from app.models.listing import Listing
from app.services.streeteasy import scrape_streeteasy, AREA_MAP

AREA_NAMES = [
    "Williamsburg", "Greenpoint", "Bushwick", "East Williamsburg",
    "Bedford-Stuyvesant", "Crown Heights", "Prospect Heights",
    "Park Slope", "Gowanus", "Carroll Gardens", "Cobble Hill",
    "Fort Greene", "Clinton Hill", "DUMBO", "Brooklyn Heights",
    "Boerum Hill", "Downtown Brooklyn", "Red Hook",
    "Long Island City", "Hunters Point", "Astoria", "Sunnyside",
    "Hell's Kitchen", "Chelsea", "East Village", "Lower East Side",
    "Upper East Side", "Upper West Side",
]

area_codes = list(set(AREA_MAP[n] for n in AREA_NAMES if n in AREA_MAP))

print(f"Scraping {len(area_codes)} area codes...")
listings = scrape_streeteasy(
    area_codes=area_codes,
    min_price=1500,
    max_price=9000,
    min_beds=0,
    max_beds=4,
    max_pages=10,
)
print(f"Scraped {len(listings)} listings")

if not listings:
    print("No listings found — exiting")
    sys.exit(0)

init_db()
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
    total = db.query(Listing).count()
    print(f"Inserted {new_count} new listings. Total in DB: {total}")
finally:
    db.close()
