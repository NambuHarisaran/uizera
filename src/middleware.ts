import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Fast cookie-presence gate for signed-in areas. This is UX routing only —
 * it cannot verify the cookie (no Admin SDK at the edge). Every server
 * component and API route re-verifies the session and role independently;
 * middleware being bypassed grants nothing.
 */

const PROTECTED_PREFIXES = [
  "/admin",
  "/host",
  "/profile",
  "/quiz",
  "/challenges",
  "/certifications",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/host/:path*",
    "/profile/:path*",
    "/quiz/:path*",
    "/challenges/:path*",
    "/certifications/:path*",
  ],
};
