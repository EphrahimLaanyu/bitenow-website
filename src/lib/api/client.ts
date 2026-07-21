import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens
} from "@/lib/auth/token-storage";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  hotelId?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
  retryOnUnauthorized?: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://34.61.93.13";
const API_PROXY_BASE = "/api/backend";

function buildUrl(path: string, params?: ApiRequestOptions["params"]) {
  const basePath = typeof window === "undefined" ? path : `${API_PROXY_BASE}${stripTrailingSlash(path)}`;
  const baseUrl = typeof window === "undefined" ? API_BASE_URL : window.location.origin;
  const url = new URL(basePath, baseUrl);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function stripTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, retryOnUnauthorized = true, ...requestOptions } = options;
  const response = await sendRequest(path, { ...requestOptions, auth });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      const retryResponse = await sendRequest(path, {
        ...requestOptions,
        auth,
        retryOnUnauthorized: false
      });
      return handleResponse<T>(retryResponse);
    }

    clearAuthTokens();
  }

  return handleResponse<T>(response);
}

async function sendRequest(path: string, options: ApiRequestOptions = {}) {
  const { auth = true, hotelId, headers, params, body, ...init } = options;
  delete init.retryOnUnauthorized;
  const requestHeaders = new Headers(headers);

  if (body && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const activeHotelId = hotelId ?? getActiveHotelId();
  if (activeHotelId) {
    requestHeaders.set("X-Hotel-ID", activeHotelId);
    requestHeaders.set("X-Active-Hotel", activeHotelId);
    requestHeaders.set("X-Hotel", activeHotelId);
  }

  return fetch(buildUrl(path, params), {
    ...init,
    body,
    headers: requestHeaders
  });
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const details = await readResponse(response);
    throw new ApiError(response.statusText || "API request failed", response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readResponse(response) as Promise<T>;
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    return null;
  }

  const response = await sendRequest("/api/v1/auth/token/refresh/", {
    auth: false,
    body: JSON.stringify({ refresh }),
    method: "POST"
  });

  if (!response.ok) {
    clearAuthTokens();
    return null;
  }

  const tokens = (await readResponse(response)) as { access: string; refresh?: string };
  saveAuthTokens({ access: tokens.access, refresh: tokens.refresh ?? refresh });
  return tokens.access;
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  if (contentType?.includes("application/json")) {
    return JSON.parse(text);
  }

  return text;
}
