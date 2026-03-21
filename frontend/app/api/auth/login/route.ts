import { NextResponse } from "next/server";
import { getLaravelApiBaseUrl } from "@/lib/api/client";
import { setSessionCookie } from "@/lib/auth/session";
import type { ApiSuccess, AuthPayload } from "@/types/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${getLaravelApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    const authPayload = payload as ApiSuccess<AuthPayload>;
    const token = authPayload.data.token;
    const nextResponse = NextResponse.json(
      {
        status: authPayload.status,
        data: {
          user: authPayload.data.user,
          customer: authPayload.data.customer ?? null,
        },
      },
      { status: response.status },
    );

    if (token) {
      setSessionCookie(nextResponse, token);
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Unable to complete login request",
      },
      { status: 500 },
    );
  }
}
