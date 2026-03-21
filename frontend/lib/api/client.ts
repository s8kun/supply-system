import { getSessionToken } from "@/lib/auth/session";
import { ApiClientError } from "@/lib/api/errors";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ServerRequestOptions = {
  method?: HttpMethod;
  body?: BodyInit | null;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export function getLaravelApiBaseUrl() {
  return process.env.LARAVEL_API_URL ?? "http://localhost:8000/api/v1";
}

export async function serverApiRequest<T>(path: string, options: ServerRequestOptions = {}) {
  const token = await getSessionToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const hasExplicitContentType = headers.has("Content-Type");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !hasExplicitContentType && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getLaravelApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body,
    cache: options.cache ?? "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new ApiClientError(
      typeof payload?.message === "string" ? payload.message : "Request failed",
      response.status,
      payload,
    );
  }

  return payload as T;
}
