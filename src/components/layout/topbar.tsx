"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function Topbar() {
  const { logout, user } = useAuth();
  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Signed in";

  return (
    <header className="sticky top-0 z-20 border-b border-[#1e3350] bg-[#07111f]/88 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative hidden w-full max-w-md sm:block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#60758f]"
            size={18}
          />
          <input
            className="h-10 w-full rounded-md border border-[#1e3350] bg-[#0b1f3a] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#60758f] focus:border-[#f97316]"
            placeholder="Search orders, tables, menu..."
            type="search"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden max-w-44 truncate text-sm text-[#91a4bc] md:inline">
            {displayName}
          </span>
          <Button aria-label="Notifications" variant="secondary">
            <Bell size={18} aria-hidden="true" />
          </Button>
          <Button onClick={logout} variant="ghost">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
