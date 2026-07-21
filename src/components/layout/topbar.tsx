"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export function Topbar() {
  const { user } = useAuth();
  const displayName =
    user?.first_name ||
    user?.name ||
    user?.username ||
    "Admin";

  return (
    <header className="sticky top-0 z-20 bg-[#eef3fb]/95 px-4 py-6 backdrop-blur md:px-8 lg:px-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-black leading-none text-[#101f3f]">
            Good morning, {displayName}
          </h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
            Here&apos;s what&apos;s happening at BiteNow today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              size={17}
            />
            <input
              className="h-10 w-64 rounded-xl border border-[var(--border)] bg-white pl-10 pr-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--ring)]"
              placeholder="Search..."
              type="search"
            />
          </div>

          <Link
            aria-label="Notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[#101f3f] shadow-sm transition-colors hover:border-[var(--accent)]"
            href="/notifications"
          >
            <Bell aria-hidden size={18} />
          </Link>

          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,98,8,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
            href="/orders/new"
          >
            <Plus aria-hidden size={17} />
            New order
          </Link>
        </div>
      </div>
    </header>
  );
}
