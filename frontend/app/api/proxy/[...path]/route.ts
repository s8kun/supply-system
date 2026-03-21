import { NextRequest, NextResponse } from "next/server";
import { getLaravelApiBaseUrl } from "@/lib/api/client";
import { getSessionToken } from "@/lib/auth/session";

function buildTargetUrl(path: string[], search: string) {
  const normalized = path.join("/");
  const base = getLaravelApiBaseUrl().replace(/\/$/, "");
  return `${base}/${normalized}${search}`;
}

async function forward(request: NextRequest, params: { path: string[] }) {
  const token = await getSessionToken();
  const targetUrl = buildTargetUrl(params.path, request.nextUrl.search);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  headers.set("accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = request.method.toUpperCase();
  const shouldSendBody = method !== "GET" && method !== "HEAD";
  const requestBody = shouldSendBody ? await request.arrayBuffer() : undefined;

  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    body: requestBody && requestBody.byteLength > 0 ? requestBody : undefined,
    cache: "no-store",
  });

  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return forward(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return forward(request, params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return forward(request, params);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return forward(request, params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return forward(request, params);
}
