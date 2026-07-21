"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  LogOut,
  ReceiptText,
  Settings,
  Table2,
  Utensils,
  Users
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/tables", label: "Tables", icon: Table2 },
  { href: "/hotels", label: "Hotels", icon: Building2 },
  { href: "/staff", label: "Memberships", icon: Users },
  { href: "/menu", label: "Menu", icon: ReceiptText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/audit-logs", label: "Audit logs", icon: ListChecks }
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const displayName =
    user?.name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "BiteNow Admin";

  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 border-r border-slate-200 bg-slate-50/50 px-4 py-6 lg:flex lg:flex-col">
      <Link className="mb-8 flex items-center gap-3 px-2" href="/dashboard">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent)] text-white shadow-sm">
          <Utensils aria-hidden size={16} />
        </span>
        <p className="text-xl font-bold tracking-tight text-slate-900">
          Bite<span className="text-[var(--accent)]">Now</span>
        </p>
      </Link>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-white text-[var(--accent)] shadow-sm ring-1 ring-inset ring-slate-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon
                size={16}
                aria-hidden="true"
                className={cn("shrink-0", active ? "text-[var(--accent)]" : "text-slate-400")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          className="flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          href="/dashboard"
        >
          <Settings aria-hidden size={16} className="shrink-0 text-slate-400" />
          Settings
        </Link>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm font-bold text-[var(--accent)] ring-1 ring-inset ring-slate-200">
              {getInitial(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-xs font-medium text-slate-500">Restaurant manager</p>
            </div>
            <button
              aria-label="Sign out"
              className="text-slate-400 transition-colors hover:text-slate-700"
              onClick={logout}
              type="button"
            >
              <LogOut aria-hidden size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "B";
}