import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://34.61.93.13";
const FORWARDED_HEADERS = [
  "accept",
  "authorization",
  "content-type",
  "x-active-hotel",
  "x-hotel",
  "x-hotel-id"
];
const MAX_LOG_BODY_LENGTH = 2000;

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(request, path);
  const headers = buildForwardedHeaders(request);
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const requestId = crypto.randomUUID();

  logProxyRequest(requestId, request, targetUrl, headers);

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      body,
      headers,
      method: request.method,
      redirect: "manual"
    });
  } catch (error) {
    console.error("[api-proxy] upstream fetch threw", {
      apiBaseUrl: API_BASE_URL,
      error: formatError(error),
      method: request.method,
      requestId,
      targetUrl
    });

    return NextResponse.json(
      {
        detail: "Unable to reach the upstream API.",
        method: request.method,
        target: targetUrl,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }

  const responseBody = await response.arrayBuffer();
  const responseHeaders = buildResponseHeaders(response);

  if (!response.ok) {
    const responseText = decodeBody(responseBody);
    const logPayload = {
      apiBaseUrl: API_BASE_URL,
      body: truncate(responseText),
      contentType: response.headers.get("content-type"),
      method: request.method,
      requestId,
      status: response.status,
      statusText: response.statusText,
      targetUrl
    };

    if (response.status >= 500) {
      console.error("[api-proxy] upstream returned server error", logPayload);
    } else {
      console.warn("[api-proxy] upstream returned client error", logPayload);
    }

    responseHeaders.set("x-api-proxy-request-id", requestId);
  }

  return new NextResponse(responseBody, {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText
  });
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const targetPath = `${path.join("/")}/`;
  const url = new URL(targetPath, normalizedApiBase());

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  return url.toString();
}

function normalizedApiBase() {
  return API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
}

function buildForwardedHeaders(request: NextRequest) {
  const headers = new Headers();

  FORWARDED_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });

  return headers;
}

function logProxyRequest(
  requestId: string,
  request: NextRequest,
  targetUrl: string,
  headers: Headers
) {
  console.info("[api-proxy] forwarding request", {
    apiBaseUrl: API_BASE_URL,
    authorizationPresent: headers.has("authorization"),
    forwardedHeaders: Array.from(headers.keys()),
    hotelContext:
      headers.get("x-hotel-id") ?? headers.get("x-active-hotel") ?? headers.get("x-hotel"),
    incomingPath: request.nextUrl.pathname,
    method: request.method,
    requestId,
    targetUrl
  });
}

function decodeBody(body: ArrayBuffer) {
  try {
    return new TextDecoder().decode(body);
  } catch {
    return "[unable to decode response body]";
  }
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return String(error);
}

function truncate(value: string) {
  return value.length > MAX_LOG_BODY_LENGTH
    ? `${value.slice(0, MAX_LOG_BODY_LENGTH)}...`
    : value;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}
