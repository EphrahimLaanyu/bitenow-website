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
    <aside className="hidden min-h-screen w-[248px] shrink-0 bg-[#101f3f] px-4 py-6 text-white lg:flex lg:flex-col">
      <Link className="mb-8 flex items-center gap-3 px-2" href="/dashboard">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
          <Utensils aria-hidden size={18} />
        </span>
        <p className="brand-logo text-2xl text-white">
          Bite<span className="text-[var(--accent)]">Now</span>
        </p>
      </Link>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#b8c5dc] transition-all hover:bg-white/10 hover:text-white",
                active && "bg-[var(--accent)] text-white shadow-[0_14px_30px_rgba(255,98,8,0.24)]"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon size={17} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <Link
          className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#b8c5dc] transition-all hover:bg-white/10 hover:text-white"
          href="/dashboard"
        >
          <Settings aria-hidden size={17} />
          Settings
        </Link>

        <div className="border-t border-white/15 pt-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[#2a1c16] text-sm font-black text-white">
              {getInitial(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{displayName}</p>
              <p className="truncate text-xs font-semibold text-[#b8c5dc]">Restaurant manager</p>
            </div>
            <button
              aria-label="Sign out"
              className="text-[#b8c5dc] transition-colors hover:text-white"
              onClick={logout}
              type="button"
            >
              <LogOut aria-hidden size={17} />
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
