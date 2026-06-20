import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "wa_admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  const session = request.cookies.get(ADMIN_COOKIE)?.value;
  if (session === "1") return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
