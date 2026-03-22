import {  useCookies   } from "react-cookie";
const SESSION_TOKEN_STORAGE_KEY = "scs_access_token";
const DEFAULT_API_BASE_URL = "https://supply-system-ru1c.onrender.com/api/v1";
const {cookies, setCookie, removeCookie} = useCookies();
function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function hasWindow() {
  return typeof window !== "undefined";
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
  if (!hasWindow()) return null;
  return window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
}

export function setStoredSessionToken(token: string) {
  if (!hasWindow()) return;
  window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
}

export function clearStoredSessionToken() {
  if (!hasWindow()) return;
  window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
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
