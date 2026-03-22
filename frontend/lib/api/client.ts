const SESSION_TOKEN_STORAGE_KEY = "scs_access_token";
const DEFAULT_API_BASE_URL = "https://supply-system-ru1c.onrender.com/api/v1";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function hasWindow() {
  return typeof window !== "undefined";
}

function getCookieValue(name: string) {
  if (!hasWindow()) return null;

  const cookieString = document.cookie ?? "";
  const segments = cookieString.split(";").map((segment) => segment.trim());
  const prefix = `${name}=`;
  const raw = segments.find((segment) => segment.startsWith(prefix));
  if (!raw) return null;

  const value = raw.slice(prefix.length);
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function setCookieValue(name: string, value: string, maxAgeSeconds: number) {
  if (!hasWindow()) return;

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearCookieValue(name: string) {
  if (!hasWindow()) return;

  document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function getLaravelApiBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_LARAVEL_API_URL ??
    process.env.LARAVEL_API_URL ??
    DEFAULT_API_BASE_URL;

  return normalizeBaseUrl(envBase);
}

export function buildLaravelApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getLaravelApiBaseUrl()}${normalizedPath}`;
}

export function getStoredSessionToken() {
  return getCookieValue(SESSION_TOKEN_STORAGE_KEY);
}

export function setStoredSessionToken(token: string) {
  setCookieValue(SESSION_TOKEN_STORAGE_KEY, token, SESSION_COOKIE_MAX_AGE_SECONDS);
}

export function clearStoredSessionToken() {
  clearCookieValue(SESSION_TOKEN_STORAGE_KEY);
}

type ApiFetchOptions = RequestInit & {
  withAuth?: boolean;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { withAuth = true, headers, cache, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (withAuth) {
    const token = getStoredSessionToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(buildLaravelApiUrl(path), {
    ...rest,
    headers: requestHeaders,
    cache: cache ?? "no-store",
  });
}
