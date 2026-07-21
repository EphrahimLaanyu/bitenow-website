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
    <header className="sticky top-0 z-20 bg-slate-50/95 border-b border-slate-200 px-4 py-5 backdrop-blur md:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Good morning, {displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening at BiteNow today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm transition-all"
              placeholder="Search..."
              type="search"
            />
          </div>

          <Link
            aria-label="Notifications"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            href="/notifications"
          >
            <Bell aria-hidden size={18} />
          </Link>

          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
            href="/orders/new"
          >
            <Plus aria-hidden size={18} />
            New order
          </Link>
        </div>
      </div>
    </header>
  );
}