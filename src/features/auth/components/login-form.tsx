"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/features/auth/api";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";

type LoginErrorState = {
  title: string;
  messages: string[];
  status?: number;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bootstrapSession } = useAuth();
  const nextUrl = getSafeNextUrl(searchParams.get("next"));
  const [error, setError] = useState<LoginErrorState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.has("email") || searchParams.has("password")) {
      router.replace(nextUrl === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    if (getAccessToken()) {
      void bootstrapSession().then((authenticated) => {
        if (authenticated) {
          router.replace(nextUrl);
        }
      });
    }
  }, [bootstrapSession, nextUrl, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await login({ email, password });
      await bootstrapSession();
      router.replace(nextUrl);
      router.refresh();
    } catch (authError) {
      setError(getLoginErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input
        autoComplete="email"
        disabled={loading}
        label="Email"
        name="email"
        placeholder="you@bitenow.com"
        required
        type="email"
      />
      <Input
        autoComplete="current-password"
        disabled={loading}
        label="Password"
        name="password"
        placeholder="Enter password"
        required
        type="password"
      />

      {error ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{error.title}</p>
            {error.status ? (
              <span className="shrink-0 rounded bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-100">
                HTTP {error.status}
              </span>
            ) : null}
          </div>
          <ul className="mt-2 space-y-1 text-red-600/90">
            {error.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button className="w-full" disabled={loading} type="submit" variant="primary">
        {loading ? "Signing in..." : "Continue"}
      </Button>
    </form>
  );
}

function getLoginErrorMessage(error: unknown): LoginErrorState {
  if (error instanceof ApiError) {
    return {
      messages: formatErrorDetails(error.details),
      status: error.status,
      title: getStatusTitle(error.status)
    };
  }

  if (error instanceof TypeError) {
    return {
      messages: [
        "The browser could not reach the application API proxy. Check that the Next.js server is running and try again."
      ],
      title: "Network error"
    };
  }

  if (error instanceof Error) {
    return {
      messages: [error.message],
      title: "Unexpected sign-in error"
    };
  }

  return {
    messages: ["An unknown error occurred while signing in."],
    title: "Unexpected sign-in error"
  };
}

function getStatusTitle(status: number) {
  if (status === 400) return "Invalid login request";
  if (status === 401) return "Authentication failed";
  if (status === 403) return "Access denied";
  if (status === 404) return "Authentication endpoint not found";
  if (status >= 500) return "Server error";
  return "Sign-in failed";
}

function formatErrorDetails(details: unknown) {
  const messages = flattenErrorDetails(details);
  return messages.length > 0 ? messages : ["The API rejected the sign-in request without a response body."];
}

function flattenErrorDetails(details: unknown, prefix?: string): string[] {
  if (!details) return [];

  if (typeof details === "string") {
    return [`${prefix ? `${prefix}: ` : ""}${details}`];
  }

  if (Array.isArray(details)) {
    return details.flatMap((item) => flattenErrorDetails(item, prefix));
  }

  if (typeof details === "object") {
    return Object.entries(details).flatMap(([key, value]) => {
      const label = key === "detail" ? undefined : humanizeFieldName(key);
      const nextPrefix = [prefix, label].filter(Boolean).join(" ");
      return flattenErrorDetails(value, nextPrefix);
    });
  }

  return [`${prefix ? `${prefix}: ` : ""}${String(details)}`];
}

function humanizeFieldName(field: string) {
  return field.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function getSafeNextUrl(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
