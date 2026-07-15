"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/lib/auth/auth-context";

export function Topbar() {
  const { logout, user } = useAuth();
  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Signed in";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative hidden w-full max-w-md sm:block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <input
            className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] pl-10 pr-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:shadow-[0_0_0_4px_var(--ring)]"
            placeholder="Search orders, tables, menu..."
            type="search"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-44 truncate text-sm text-[var(--muted)] md:inline">
            {displayName}
          </span>
          <Button aria-label="Notifications" variant="secondary">
            <Bell size={18} aria-hidden="true" />
          </Button>
          <ThemeToggle />
          <Button onClick={logout} variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
