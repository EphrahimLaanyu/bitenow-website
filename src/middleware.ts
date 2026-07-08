import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/hotels",
  "/menu",
  "/tables",
  "/orders",
  "/payments",
  "/staff",
  "/notifications",
  "/audit-logs"
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const accessToken = request.cookies.get("hotel_access_token")?.value;

  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/hotels/:path*",
    "/menu/:path*",
    "/tables/:path*",
    "/orders/:path*",
    "/payments/:path*",
    "/staff/:path*",
    "/notifications/:path*",
    "/audit-logs/:path*"
  ]
};
