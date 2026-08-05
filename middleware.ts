import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.cookies.has("vi_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/driver/:path*",
    "/checkout/:path*",
    "/trips/:path*",
    "/merchant/:path*",
    "/provider/:path*",
  ],
};
