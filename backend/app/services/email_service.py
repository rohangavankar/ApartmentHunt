from typing import List, Dict, Any, Optional
from app.config import settings


def send_alert_email(to_email: str, alert_name: str, listings: List[Dict[str, Any]]) -> bool:
    if not settings.SENDGRID_API_KEY:
        print(f"[email] No SendGrid key — would send {len(listings)} listings to {to_email}")
        return True  # pretend success in dev

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        lines_html = ""
        for l in listings[:10]:
            beds = "Studio" if l["bedrooms"] == 0 else f"{int(l['bedrooms'])}BR"
            url = l.get("listing_url") or "#"
            lines_html += f"""
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee">
                <a href="{url}" style="color:#2563eb;font-weight:600">{l['title']}</a><br>
                <span style="color:#6b7280;font-size:13px">{l['address']}</span>
              </td>
              <td style="padding:8px;border-bottom:1px solid #eee;white-space:nowrap">
                <strong style="color:#16a34a">${l['price']:,}/mo</strong><br>
                <span style="color:#6b7280;font-size:13px">{beds}</span>
              </td>
            </tr>"""

        html = f"""
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1e3a5f">ApartHunt Alert: {alert_name}</h2>
          <p>{len(listings)} new listing{'s' if len(listings) != 1 else ''} match your criteria:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            {lines_html}
          </table>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">
            Manage your alerts at <a href="http://localhost:3000/alerts">ApartHunt</a>
          </p>
        </div>"""

        msg = Mail(
            from_email=settings.SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=f"ApartHunt: {len(listings)} new match{'es' if len(listings) != 1 else ''} for \"{alert_name}\"",
            html_content=html,
        )
        sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        sg.send(msg)
        return True
    except Exception as e:
        print(f"[email] Failed to send: {e}")
        return False


