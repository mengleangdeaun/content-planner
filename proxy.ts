import { NextRequest, NextResponse } from "next/server";
import { isBlockedAgent } from "./lib/bot-filter";
import { SESSION_COOKIE, readSessionToken } from "./lib/auth/session";

// Cookie check only, as the Next docs advise. Real permission checks are in each route handler.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Crawlers must be able to read "Disallow: /", so robots.txt is the one thing open to everyone.
  if (path === "/robots.txt") return NextResponse.next();

  // An internal tool: crawlers, AI agents and link previews get nothing, not even the sign-in page.
  if (isBlockedAgent(req.headers.get("user-agent"))) {
    return new NextResponse("Not available.", { status: 403, headers: { "Content-Type": "text/plain" } });
  }

  if (path === "/login" || path.startsWith("/api/auth/")) return NextResponse.next();

  if (await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)$).*)"],
};
