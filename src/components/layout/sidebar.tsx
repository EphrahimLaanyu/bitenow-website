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
    <aside className="hidden min-h-screen w-72 border-r border-[#1e3350] bg-[#07111f]/92 px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-[#f97316] text-[#111827]">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f97316]">
            Hotel OS
          </p>
          <p className="text-xs text-[#91a4bc]">Ordering console</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#91a4bc] transition-colors hover:bg-[#102a4c] hover:text-white",
                active && "bg-[#102a4c] text-white"
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
