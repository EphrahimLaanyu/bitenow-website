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
  ReceiptText,
  ShieldCheck,
  Table2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hotels", label: "Hotels", icon: Building2 },
  { href: "/menu", label: "Menu", icon: ReceiptText },
  { href: "/tables", label: "Tables", icon: Table2 },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/staff", label: "Staff", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/audit-logs", label: "Audit logs", icon: ListChecks }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">BiteNow</p>
          <p className="text-xs font-semibold text-[var(--muted)]">Operations console</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                active && "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
