import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "wa_admin";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const { password } = (await request.json()) as { password?: string };
  if (password !== secret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
