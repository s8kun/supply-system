import { NextResponse } from "next/server";
import { getLaravelApiBaseUrl } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ status: "error", message: "Unauthenticated" }, { status: 401 });
  }

  const response = await fetch(`${getLaravelApiBaseUrl()}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
