import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "wa_admin";

function clerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key) return false;
  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProd && key.startsWith("pk_test_")) return false;
  return true;
}

function adminGuard(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return null;
  if (pathname === "/admin/login") return NextResponse.next();
  const session = request.cookies.get(ADMIN_COOKIE)?.value;
  if (session === "1") return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

/** All app routes public — mom never forced to sign in. Admin uses cookie guard. */
const handler = clerkEnabled()
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
    "/(api|trpc)(.*)",
  ],
};
