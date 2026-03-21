import { NextResponse } from "next/server";
import { getLaravelApiBaseUrl } from "@/lib/api/client";
import { clearSessionCookie, getSessionToken } from "@/lib/auth/session";

export async function POST() {
  const token = await getSessionToken();

  if (token) {
    await fetch(`${getLaravelApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.json({ status: "success", data: null });
  clearSessionCookie(response);
  return response;
}
