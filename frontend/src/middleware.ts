import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INVITE_TOKEN = process.env.INVITE_TOKEN;
const COOKIE = "ah_access";

export function middleware(req: NextRequest) {
  // No token configured → open access (dev mode)
  if (!INVITE_TOKEN) return NextResponse.next();

  const { pathname, searchParams } = req.nextUrl;

  // Always allow the locked page itself
  if (pathname === "/locked") return NextResponse.next();

  const cookieToken = req.cookies.get(COOKIE)?.value;
  const urlToken = searchParams.get("invite");

  // Valid invite link → set cookie and redirect to clean URL
  if (urlToken === INVITE_TOKEN) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("invite");
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, INVITE_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return res;
  }

  // Valid cookie → allow through
  if (cookieToken === INVITE_TOKEN) return NextResponse.next();

  // No access → locked page
  return NextResponse.redirect(new URL("/locked", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
