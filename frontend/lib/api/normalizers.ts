import type { ApiError, ApiMessageSuccess, ApiSuccess } from "@/types/api";

type PaginatedShape<T> = {
  data: T[];
  links?: unknown;
  meta?: unknown;
};

export function unwrapApiData<T>(payload: ApiSuccess<T>) {
  return payload.data;
}

export function unwrapApiMessage(payload: ApiMessageSuccess) {
  return payload.message;
}

export function normalizePaginatedCollection<T>(payload: ApiSuccess<T[] | PaginatedShape<T>>) {
  const raw = payload.data;
  if (Array.isArray(raw)) {
    return { items: raw, links: undefined, meta: undefined };
  }

  return { items: raw.data, links: raw.links, meta: raw.meta };
}

export function normalizeValidationError(payload: ApiError) {
  const fieldErrors: Record<string, string> = {};
  const rawErrors = payload.errors ?? {};

  for (const [field, errors] of Object.entries(rawErrors)) {
    if (errors.length > 0) {
      fieldErrors[field] = errors[0];
    }
  }

  return { message: payload.message, fieldErrors };
}
