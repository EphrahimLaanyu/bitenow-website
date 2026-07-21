"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogOut, Mail, RefreshCw, ShieldCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";

export function ClientProfilePageClient() {
  const { bootstrapSession, logout, status, user } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated" && getAccessToken()) {
      void bootstrapSession();
    }
  }, [bootstrapSession, status]);

  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "BiteNow Guest";

  if (status === "checking") {
    return (
      <div className="space-y-5">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/70" />
      </div>
    );
  }

  if (status === "unauthenticated" && !getAccessToken()) {
    return (
      <div className="space-y-6">
        <ProfileHeader />
        <Card>
          <h2 className="text-xl font-extrabold text-[var(--foreground)]">Sign in required</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Your profile is loaded from the authenticated `/auth/me` session.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)]"
            href="/login?next=%2Fclient%2Fprofile"
          >
            Sign in
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <ProfileHeader />

      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--primary)] text-white shadow-[0_16px_34px_rgba(16,31,63,0.20)]">
                <User aria-hidden size={28} />
              </span>
              <div>
                <Badge>Authenticated profile</Badge>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm leading-6 text-[var(--muted)]">
                  <Mail aria-hidden size={16} />
                  {user?.email ?? "Email not provided"}
                </p>
              </div>
            </div>

            <Button onClick={logout} type="button" variant="danger">
              <LogOut aria-hidden size={17} />
              Logout
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden className="text-[var(--primary)]" size={20} />
            <h2 className="text-lg font-extrabold text-[var(--foreground)]">Session</h2>
          </div>
          <div className="mt-5 space-y-3">
            <ProfileRow label="Status" value="Authenticated" />
            <ProfileRow label="User ID" value={user?.id ?? "Not returned"} />
            <ProfileRow label="Username" value={user?.username ?? "Not returned"} />
          </div>
          <Button className="mt-5 w-full" onClick={() => bootstrapSession()} type="button" variant="secondary">
            <RefreshCw aria-hidden size={17} />
            Refresh profile
          </Button>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-extrabold text-[var(--foreground)]">Profile fields</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          These fields are read from `GET /api/v1/auth/me/`. Profile editing can be added later when
          the backend exposes update endpoints.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ProfileStat label="First name" value={user?.first_name ?? "Not returned"} />
          <ProfileStat label="Last name" value={user?.last_name ?? "Not returned"} />
          <ProfileStat label="Name" value={user?.name ?? "Not returned"} />
          <ProfileStat label="Email" value={user?.email ?? "Not returned"} />
        </div>
      </Card>
    </div>
  );
}

function ProfileHeader() {
  return (
    <div>
      <Badge>Profile</Badge>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
        Your BiteNow account
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        View your authenticated guest profile and manage the current session.
      </p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold text-[var(--muted)]">{label}</span>
      <span className="max-w-44 truncate text-right text-sm font-extrabold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 truncate text-sm font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
