import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ADMIN_COOKIE = "wa_admin";

async function proxyAdmin(path: string, search: string) {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const res = await fetch(`${API_URL}/admin/${path}${search}`, {
    headers: { "X-Admin-Key": secret },
    cache: "no-store",
  });

  const body = await res.json();
  return NextResponse.json(body, { status: res.status });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  const { search } = new URL(request.url);
  return proxyAdmin(resource, search);
}
