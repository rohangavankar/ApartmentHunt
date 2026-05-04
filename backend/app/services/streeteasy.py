"""
StreetEasy rental listing scraper.

Parses listings from the React Server Components (RSC) streaming payload
embedded in StreetEasy's HTML responses — no headless browser needed.
URL format: https://streeteasy.com/for-rent/nyc/status:open|price:min-max|area:codes|beds:min-max?sort_by=listed_desc&page=N
"""

import logging
import random
import re
import time
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# StreetEasy neighborhood name → numeric area code
AREA_MAP: dict[str, int] = {
    # Manhattan
    "Manhattan": 100,
    "Financial District": 104,
    "Tribeca": 105,
    "SoHo": 107,
    "Lower East Side": 109,
    "Chinatown": 110,
    "Battery Park City": 112,
    "Chelsea": 115,
    "Greenwich Village": 116,
    "East Village": 117,
    "NoHo": 118,
    "Midtown": 120,
    "Midtown East": 123,
    "Midtown West": 124,
    "Murray Hill": 130,
    "Upper West Side": 137,
    "Upper East Side": 140,
    "Lenox Hill": 141,
    "Yorkville": 142,
    "Washington Heights": 149,
    "Inwood": 150,
    "Hell's Kitchen": 152,
    "Harlem": 154,
    "East Harlem": 155,
    "West Village": 157,
    "Flatiron": 158,
    "NoMad": 159,
    "Nolita": 162,
    "West Chelsea": 163,
    "Hudson Square": 166,
    # Brooklyn
    "Brooklyn": 300,
    "Greenpoint": 301,
    "Williamsburg": 302,
    "Downtown Brooklyn": 303,
    "Fort Greene": 304,
    "Brooklyn Heights": 305,
    "Boerum Hill": 306,
    "DUMBO": 307,
    "Bedford-Stuyvesant": 310,
    "Bed-Stuy": 310,
    "Bushwick": 313,
    "Red Hook": 318,
    "Park Slope": 319,
    "Gowanus": 320,
    "Carroll Gardens": 321,
    "Cobble Hill": 322,
    "Crown Heights": 325,
    "Prospect Heights": 326,
    "Columbia St Waterfront District": 328,
    "Prospect Lefferts Gardens": 329,
    "Clinton Hill": 364,
    "East Williamsburg": 373,
    # Queens
    "Queens": 400,
    "Astoria": 401,
    "Long Island City": 402,
    "Sunnyside": 403,
    "Woodside": 404,
    "Jackson Heights": 405,
    "Elmhurst": 408,
    "Ridgewood": 412,
    "Forest Hills": 415,
    "Flushing": 416,
    "Hunters Point": 478,
    # Bronx
    "Bronx": 200,
    "Mott Haven": 201,
    "Fordham": 214,
    "Riverdale": 225,
}

_BOROUGH_COORDS: dict[str, tuple[float, float]] = {
    "Manhattan": (40.7831, -73.9712),
    "Brooklyn": (40.6782, -73.9442),
    "Queens": (40.7282, -73.7949),
    "Bronx": (40.8448, -73.8648),
}

# RSC patterns — StreetEasy embeds listing data as streaming RSC payload
_LISTING_RE = re.compile(
    r'"id":"(\d+)","areaName":"([^"]+)".*?"bedroomCount":(\d+).*?"fullBathroomCount":(\d+)'
    r'.*?"geoPoint":"\$([0-9a-f]+)".*?"price":(\d+).*?"street":"([^"]+)"'
    r'.*?"displayUnit":"([^"]*)".*?"urlPath":"([^"]+)".*?"zipCode":"([^"]+)"',
    re.S,
)
_COORD_RE = re.compile(
    r'\n([0-9a-f]+):\{"latitude":(-?\d+\.\d+),"longitude":(-?\d+\.\d+)\}'
)
_PAGE_INFO_RE = re.compile(r'"totalCount":(\d+).*?"totalPages":(\d+)', re.S)


def _get_headers() -> dict:
    try:
        from fake_useragent import UserAgent
        user_agent = UserAgent().random
    except Exception:
        user_agent = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
    return {
        "user-agent": user_agent,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "referer": "https://streeteasy.com/",
        "cache-control": "no-cache",
    }


def _build_url(area_codes: list[int], min_price: int, max_price: int, min_beds: int, max_beds: int, page: int = 1) -> str:
    area = ",".join(str(c) for c in area_codes)
    path = f"status:open|price:{min_price}-{max_price}|area:{area}|beds:{min_beds}-{max_beds}"
    url = f"https://streeteasy.com/for-rent/nyc/{path}?sort_by=listed_desc"
    if page > 1:
        url += f"&page={page}"
    return url


def _extract_rsc(html: str) -> str:
    """Concatenate and unescape all RSC push chunks from the page HTML."""
    parts = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html, re.S)
    combined = "".join(parts)
    return (
        combined
        .replace('\\"', '"')
        .replace('\\n', '\n')
        .replace('\\\\', '\\')
        .replace('\\u003e', '>')
        .replace('\\u003c', '<')
        .replace('\\u0026', '&')
    )


def _parse_rsc(rsc: str) -> list[dict]:
    coord_map = {
        m.group(1): (float(m.group(2)), float(m.group(3)))
        for m in _COORD_RE.finditer(rsc)
    }

    results = []
    for m in _LISTING_RE.finditer(rsc):
        lid, area, beds, baths, geo_ref, price, street, unit, url_path, zipcode = m.groups()
        lat, lon = coord_map.get(geo_ref, _BOROUGH_COORDS.get(_guess_borough(area), (40.7580, -73.9855)))
        address = f"{street} {unit}".strip() if unit else street
        beds_f = float(beds)
        title = f"{int(beds_f)} BR at {address}" if beds_f > 0 else f"Studio at {address}"
        results.append({
            "external_id": f"streeteasy_{lid}",
            "source": "streeteasy",
            "title": title,
            "address": address,
            "neighborhood": area,
            "borough": _guess_borough(area),
            "city": "New York",
            "state": "NY",
            "zip_code": zipcode,
            "lat": lat,
            "lon": lon,
            "price": int(price),
            "bedrooms": beds_f,
            "bathrooms": float(baths),
            "sqft": None,
            "listing_url": f"https://streeteasy.com{url_path}",
            "images": [],
            "amenities": [],
            "description": None,
            "source_data": {"id": lid, "areaName": area, "street": street, "unit": unit},
        })
    return results


def _guess_borough(neighborhood: str) -> str:
    n = neighborhood.lower()
    brooklyn = {"williamsburg", "greenpoint", "bushwick", "park slope", "bedford", "bed-stuy",
                 "dumbo", "carroll", "cobble", "boerum", "fort greene", "clinton hill",
                 "prospect", "crown heights", "gowanus", "red hook", "downtown brooklyn"}
    queens = {"astoria", "long island city", "lic", "sunnyside", "jackson heights",
              "flushing", "forest hills", "ridgewood", "elmhurst", "queens", "hunters point"}
    bronx = {"bronx", "mott haven", "fordham", "riverdale"}
    if any(h in n for h in brooklyn):
        return "Brooklyn"
    if any(h in n for h in queens):
        return "Queens"
    if any(h in n for h in bronx):
        return "Bronx"
    return "Manhattan"


def scrape_streeteasy(
    area_codes: list[int],
    min_price: int = 2000,
    max_price: int = 6000,
    min_beds: int = 0,
    max_beds: int = 3,
    max_pages: int = 3,
) -> list[dict]:
    """
    Scrape StreetEasy and return normalized listing dicts ready for the Listing model.
    Parses the RSC streaming payload embedded in the HTML — no headless browser needed.
    """
    session = requests.Session()
    session.headers.update(_get_headers())

    results = []
    seen_ids: set[str] = set()

    try:
        for page in range(1, max_pages + 1):
            url = _build_url(area_codes, min_price, max_price, min_beds, max_beds, page)
            logger.info(f"[streeteasy] page {page}: {url}")

            try:
                resp = session.get(url, timeout=20)
            except Exception as e:
                logger.warning(f"[streeteasy] request failed: {e}")
                break

            if resp.status_code != 200:
                logger.warning(f"[streeteasy] HTTP {resp.status_code}")
                break

            rsc = _extract_rsc(resp.text)
            page_listings = _parse_rsc(rsc)

            # Log total available on first page
            if page == 1:
                info = _PAGE_INFO_RE.search(rsc)
                if info:
                    logger.info(f"[streeteasy] {info.group(1)} total listings across {info.group(2)} pages")

            new_on_page = 0
            for listing in page_listings:
                ext_id = listing["external_id"]
                if ext_id not in seen_ids:
                    seen_ids.add(ext_id)
                    results.append(listing)
                    new_on_page += 1

            logger.info(f"[streeteasy] page {page}: {new_on_page} new listings")

            if not page_listings or page >= max_pages:
                break

            time.sleep(random.uniform(2.5, 5.0))
    finally:
        session.close()

    logger.info(f"[streeteasy] done — {len(results)} total listings")
    return results
