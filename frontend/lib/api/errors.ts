import type { ApiError } from "@/types/api";

export class ApiClientError extends Error {
  statusCode: number;
  payload?: unknown;

  constructor(message: string, statusCode: number, payload?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

export function toApiError(payload: unknown, fallbackMessage = "Request failed"): ApiError {
  if (!payload || typeof payload !== "object") {
    return { message: fallbackMessage };
  }

  const value = payload as Record<string, unknown>;
  const message = typeof value.message === "string" ? value.message : fallbackMessage;
  const status = value.status === "error" ? "error" : undefined;
  const errors =
    typeof value.errors === "object" && value.errors
      ? (value.errors as Record<string, string[]>)
      : undefined;

  return { status, message, errors };
}
