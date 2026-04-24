import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/home/:path*", "/input/:path*"],
};
