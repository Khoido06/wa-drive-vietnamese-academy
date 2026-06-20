import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isClerkEnabled } from "./lib/clerk-config";

const ADMIN_COOKIE = "wa_admin";

function adminGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return null;
  if (pathname === "/admin/login") return NextResponse.next();
  const session = request.cookies.get(ADMIN_COOKIE)?.value;
  if (session === "1") return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

/** All app routes public — mom never forced to sign in. Admin uses cookie guard. */
const handler = isClerkEnabled()
  ? clerkMiddleware((_auth, request) => {
      const admin = adminGuard(request);
      return admin ?? NextResponse.next();
    })
  : (request: NextRequest) => {
      const admin = adminGuard(request);
      return admin ?? NextResponse.next();
    };

export default handler;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
