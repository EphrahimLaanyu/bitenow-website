export type AuthTokens = {
  access: string;
  refresh?: string;
};

const ACCESS_TOKEN_KEY = "hotel_access_token";
const REFRESH_TOKEN_KEY = "hotel_refresh_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isBrowser() {
  return typeof window !== "undefined";
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function saveAuthTokens(tokens: AuthTokens) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
  setCookie(ACCESS_TOKEN_KEY, tokens.access);
}

export function getAccessToken() {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  deleteCookie(ACCESS_TOKEN_KEY);
}

export function getTokenExpiry(token: string) {
  try {
    const encodedPayload = token.split(".")[1] ?? "";
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(window.atob(paddedBase64));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
