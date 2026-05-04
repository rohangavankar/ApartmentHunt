"""
Run once to populate the database with realistic NYC/JC listings and neighborhoods.
Usage: python seed_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import init_db, SessionLocal
from app.models.listing import Listing
from app.models.neighborhood import Neighborhood
from datetime import date, timedelta
import random

random.seed(42)

NEIGHBORHOODS = [
    # (name, borough, lat, lon, transit_score, walk_score, subway_lines, vibe_tags, avg_studio, avg_1br, avg_2br, desc)
    ("Upper East Side", "Manhattan", 40.7736, -73.9566, 85, 92, ["4","5","6","Q"], ["upscale","family-friendly","museums"], 2800, 4200, 6500, "Elegant and safe, home to Museum Mile and Central Park. Great for professionals."),
    ("Upper West Side", "Manhattan", 40.7870, -73.9754, 88, 90, ["1","2","3","B","C"], ["upscale","family-friendly","parks"], 2900, 4400, 6800, "Cultural hub near Lincoln Center and Riverside Park. Classic NYC charm."),
    ("Midtown", "Manhattan", 40.7549, -73.9840, 98, 95, ["1","2","3","4","5","6","7","A","B","C","D","E","F","N","Q","R"], ["busy","professional","central"], 3200, 4800, 7500, "Heart of Manhattan. Unbeatable transit access, close to everything."),
    ("Chelsea", "Manhattan", 40.7465, -74.0014, 90, 94, ["1","C","E","A","L"], ["trendy","nightlife","art"], 3000, 4500, 6500, "Art galleries, the High Line, and great restaurants. Very walkable."),
    ("Greenwich Village", "Manhattan", 40.7336, -74.0027, 88, 96, ["A","B","C","D","E","F","M","1","2","3"], ["trendy","restaurants","nightlife","historic"], 3100, 4600, 7000, "Iconic, tree-lined streets with world-class dining and nightlife."),
    ("East Village", "Manhattan", 40.7265, -73.9815, 87, 97, ["L","N","Q","R","W","4","5","6"], ["nightlife","trendy","restaurants","young"], 2600, 3800, 5500, "Vibrant nightlife, eclectic restaurants, young crowd. Buzzing energy."),
    ("Lower East Side", "Manhattan", 40.7150, -73.9848, 85, 93, ["F","J","M","Z","B","D"], ["nightlife","trendy","young"], 2400, 3500, 5200, "Edgy, artsy, and affordable for Manhattan. Great bar and music scene."),
    ("SoHo", "Manhattan", 40.7233, -74.0030, 87, 96, ["C","E","1","A","N","Q","R","W","6"], ["upscale","shopping","trendy"], 3500, 5500, 8500, "Chic cast-iron buildings, designer boutiques, and great brunch spots."),
    ("Tribeca", "Manhattan", 40.7195, -74.0089, 85, 91, ["1","2","3","A","C","E"], ["upscale","family-friendly","quiet"], 4000, 6500, 10000, "Ultra-premium. Cobblestone streets, celebrity neighbors, and quiet luxury."),
    ("Harlem", "Manhattan", 40.8116, -73.9465, 87, 88, ["2","3","4","5","6","A","B","C","D"], ["cultural","restaurants","affordable"], 1800, 2600, 3800, "Rich cultural heritage, great soul food, and rising prices. Excellent transit."),
    ("Washington Heights", "Manhattan", 40.8448, -73.9393, 85, 85, ["A","1"], ["affordable","cultural","community"], 1600, 2300, 3200, "Large Dominican community, affordable for Manhattan, great A-train access."),
    ("Williamsburg", "Brooklyn", 40.7081, -73.9571, 82, 91, ["L","J","M","Z","G"], ["nightlife","trendy","young","restaurants"], 2400, 3500, 5000, "Brooklyn's trendiest neighborhood. L-train to Manhattan in 10 min."),
    ("Park Slope", "Brooklyn", 40.6710, -73.9814, 82, 94, ["2","3","4","5","B","Q","F","G","R"], ["family-friendly","parks","restaurants","upscale"], 2400, 3600, 5200, "Gorgeous brownstones, Prospect Park access, top-ranked school district."),
    ("DUMBO", "Brooklyn", 40.7033, -73.9881, 78, 88, ["A","C","F","R","2","3"], ["upscale","trendy","views"], 2800, 4500, 6500, "Stunning Manhattan Bridge views, tech offices, and premium lofts."),
    ("Brooklyn Heights", "Manhattan", 40.6962, -73.9937, 80, 89, ["A","C","2","3","4","5","R"], ["upscale","quiet","family-friendly","views"], 2700, 4200, 6000, "Historic, tree-lined streets with waterfront promenade and skyline views."),
    ("Bushwick", "Brooklyn", 40.6944, -73.9213, 75, 83, ["L","J","M","Z"], ["affordable","nightlife","art","young"], 1600, 2400, 3400, "Streetart haven, large apartments for less. Very creative community."),
    ("Crown Heights", "Brooklyn", 40.6678, -73.9421, 76, 80, ["2","3","4","5"], ["affordable","cultural","community"], 1700, 2500, 3600, "Diverse, vibrant, and affordable. Great Caribbean food and green spaces."),
    ("Prospect Heights", "Brooklyn", 40.6756, -73.9636, 79, 88, ["2","3","4","5","B","Q"], ["trendy","family-friendly","restaurants"], 2200, 3200, 4800, "Walkable with Prospect Park nearby. Booming restaurant scene."),
    ("Carroll Gardens", "Brooklyn", 40.6800, -73.9996, 75, 88, ["F","G"], ["quiet","family-friendly","restaurants","upscale"], 2300, 3400, 5000, "Quiet, leafy, and quintessentially Brooklyn. Italian roots, great restaurants."),
    ("Astoria", "Queens", 40.7721, -73.9302, 80, 87, ["N","W"], ["affordable","restaurants","community"], 1800, 2600, 3800, "Best Greek food in NYC. Great value, strong community, easy N/W to Manhattan."),
    ("Long Island City", "Queens", 40.7447, -73.9485, 88, 82, ["7","E","M","G","N","W"], ["trendy","professional","views"], 2200, 3200, 4800, "Fastest-growing neighborhood. 5 min to Midtown by 7 train. Great skyline views."),
    ("Jackson Heights", "Queens", 40.7462, -73.8942, 85, 88, ["7","E","F","M","R"], ["affordable","cultural","restaurants"], 1500, 2200, 3200, "Incredible ethnic food, affordable, and excellent transit to Manhattan."),
    ("Flushing", "Queens", 40.7675, -73.8330, 78, 90, ["7","LIRR"], ["affordable","cultural","community"], 1300, 1900, 2800, "Best Chinese food outside China. Cheap, diverse, and surprisingly well-connected."),
    ("Downtown JC", "Jersey City", 40.7178, -74.0431, 82, 90, ["PATH","LightRail"], ["trendy","professional","affordable","views"], 1700, 2500, 3500, "PATH train to Manhattan in 10 min. Waterfront views at a fraction of NYC prices."),
    ("Journal Square", "Jersey City", 40.7327, -74.0630, 78, 80, ["PATH"], ["affordable","community","transit"], 1400, 2000, 2900, "Improving rapidly. Very affordable with direct PATH to Manhattan."),
    ("Heights JC", "Jersey City", 40.7480, -74.0528, 65, 78, ["LightRail","bus"], ["affordable","community","quiet"], 1200, 1800, 2600, "Quiet, affordable, and up-and-coming. Great for those who don't mind a longer commute."),
]

AMENITIES_POOL = [
    "Dishwasher", "In-unit laundry", "Rooftop deck", "Gym", "Doorman", "Elevator",
    "Pet-friendly", "Bike storage", "Storage unit", "Central AC", "Hardwood floors",
    "Exposed brick", "High ceilings", "Balcony", "Concierge", "Package room",
    "Virtual doorman", "Live-in super", "Outdoor space", "Terrace",
]

STREET_NAMES = [
    "Broadway", "Park Ave", "Lexington Ave", "Madison Ave", "Amsterdam Ave",
    "Columbus Ave", "West End Ave", "Riverside Dr", "Central Park West",
    "Bedford Ave", "Berry St", "Wythe Ave", "Grand St", "Myrtle Ave",
    "Franklin Ave", "Flatbush Ave", "Atlantic Ave", "Court St", "Smith St",
    "Steinway St", "31st Ave", "Jackson Ave", "Northern Blvd", "Queens Blvd",
    "Grove St", "Newark Ave", "Palisade Ave", "Summit Ave", "Jersey Ave",
]

IMAGE_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e97?w=800",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
]


def make_listing(nbhd_data, bed_count, price, idx):
    name, borough, lat, lon, ts, ws, lines, vibes, *_ = nbhd_data
    jitter_lat = lat + random.uniform(-0.008, 0.008)
    jitter_lon = lon + random.uniform(-0.010, 0.010)
    street_num = random.randint(10, 500)
    street = random.choice(STREET_NAMES)
    state = "NJ" if "Jersey" in borough else "NY"
    city = "Jersey City" if "Jersey" in borough else ("New York" if borough != "Brooklyn" and borough != "Queens" else borough)

    bed_label = "Studio" if bed_count == 0 else f"{int(bed_count)}BR"
    title = f"{bed_label} in {name}"
    amenity_count = random.randint(2, 7)
    amenities = random.sample(AMENITIES_POOL, amenity_count)
    images = random.sample(IMAGE_PLACEHOLDERS, min(3, len(IMAGE_PLACEHOLDERS)))
    avail_days = random.randint(0, 60)

    return Listing(
        source="seed",
        title=title,
        address=f"{street_num} {street}, {name}, {city}, {state}",
        neighborhood=name,
        borough=borough,
        city=city,
        state=state,
        zip_code=None,
        lat=round(jitter_lat, 6),
        lon=round(jitter_lon, 6),
        price=price,
        bedrooms=bed_count,
        bathrooms=1.0 if bed_count <= 1 else (1.5 if bed_count <= 2 else 2.0),
        sqft=_sqft(bed_count),
        listing_url=None,
        images=images,
        amenities=amenities,
        description=f"Beautiful {bed_label} in the heart of {name}. {nbhd_data[11]}",
        available_date=date.today() + timedelta(days=avail_days),
        transit_score=ts,
        walk_score=ws,
        is_active=True,
    )


def _sqft(beds: float) -> int:
    base = {0: 450, 1: 650, 2: 950, 3: 1300}
    return base.get(beds, 550) + random.randint(-80, 120)


def _price_with_noise(base: int) -> int:
    noise = random.uniform(0.88, 1.12)
    return int(round(base * noise / 100) * 100)


def seed_neighborhoods(db) -> dict:
    created = {}
    for n in NEIGHBORHOODS:
        name, borough, lat, lon, ts, ws, lines, vibes, avg_s, avg_1, avg_2, desc = n
        existing = db.query(Neighborhood).filter(Neighborhood.name == name).first()
        if not existing:
            nbhd = Neighborhood(
                name=name,
                borough=borough,
                lat=lat,
                lon=lon,
                transit_score=ts,
                walk_score=ws,
                subway_lines=lines,
                vibe_tags=vibes,
                avg_rent_studio=avg_s,
                avg_rent_1br=avg_1,
                avg_rent_2br=avg_2,
                description=desc,
                nearby_stations=[],
            )
            db.add(nbhd)
            created[name] = n
    db.commit()
    print(f"Seeded {len(created)} neighborhoods")
    return created


def seed_listings(db):
    existing = db.query(Listing).count()
    if existing > 0:
        print(f"Skipping listings seed — {existing} already exist")
        return

    count = 0
    for idx, nbhd_data in enumerate(NEIGHBORHOODS):
        name, borough, lat, lon, ts, ws, lines, vibes, avg_s, avg_1, avg_2, desc = nbhd_data
        full = nbhd_data  # tuple with all fields

        # Studios
        for i in range(random.randint(2, 5)):
            db.add(make_listing(full, 0, _price_with_noise(avg_s), count))
            count += 1

        # 1BRs
        for i in range(random.randint(3, 7)):
            db.add(make_listing(full, 1, _price_with_noise(avg_1), count))
            count += 1

        # 2BRs
        for i in range(random.randint(2, 5)):
            db.add(make_listing(full, 2, _price_with_noise(avg_2), count))
            count += 1

        # 3BRs (occasional)
        if random.random() > 0.5:
            db.add(make_listing(full, 3, _price_with_noise(int(avg_2 * 1.45)), count))
            count += 1

    db.commit()
    print(f"Seeded {count} listings")


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    db = SessionLocal()
    try:
        seed_neighborhoods(db)
        seed_listings(db)
        print("Done!")
    finally:
        db.close()
