from typing import List, Dict, Any, Optional
from app.config import settings

SYSTEM_PROMPT = """You are ApartHunt AI, an expert NYC apartment search assistant.
You help users find their perfect apartment in New York City and Jersey City.

You know about:
- NYC neighborhoods (Manhattan, Brooklyn, Queens, Bronx, Jersey City)
- Typical rent ranges and trends
- Subway lines, commute times, and walkability
- Apartment features and what to look for
- Lease terms, broker fees, and NYC-specific rental rules
- Current listings in the database (provided in context)

Be concise, friendly, and specific. When recommending neighborhoods or apartments,
give concrete reasons. If asked about specific listings, reference the data provided."""


def build_listing_context(listings: List[Dict[str, Any]]) -> str:
    if not listings:
        return ""
    lines = ["Here are some current listings in our database:\n"]
    for l in listings[:8]:
        beds = "Studio" if l["bedrooms"] == 0 else f"{int(l['bedrooms'])}BR"
        lines.append(
            f"- {beds} in {l['neighborhood']}, {l['borough']}: ${l['price']:,}/mo "
            f"({l.get('sqft', '?')} sqft) — {l['address']}"
        )
    return "\n".join(lines)


async def chat_with_claude(
    messages: List[Dict[str, str]],
    listing_context: Optional[str] = None,
) -> str:
    if not settings.ANTHROPIC_API_KEY:
        return (
            "The AI chatbot requires an Anthropic API key. "
            "Add ANTHROPIC_API_KEY to your .env file to enable the chatbot. "
            "In the meantime, try the map view to browse listings or set up an alert!"
        )

    import anthropic

    system = SYSTEM_PROMPT
    if listing_context:
        system += f"\n\n{listing_context}"

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    return response.content[0].text
