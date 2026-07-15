"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Hotel,
  Menu,
  User,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const clientNavItems = [
  { href: "/client/hotels", label: "Hotels", icon: Hotel },
  { href: "/client/menu", label: "Menu", icon: Menu },
  { href: "/client/cart", label: "Cart", icon: ShoppingCart },
  { href: "/client/checkout", label: "Checkout", icon: CreditCard },
  { href: "/client/orders", label: "Orders", icon: ClipboardList },
  { href: "/client/payments", label: "Payments", icon: CreditCard },
  { href: "/client/notifications", label: "Notifications", icon: Bell },
  { href: "/client/profile", label: "Profile", icon: User }
];

export function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/client/hotels">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-blue-500/20">
              <Sparkles aria-hidden size={20} />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight">BiteNow</p>
              <p className="text-xs font-semibold text-[var(--muted)]">Guest ordering</p>
            </div>
          </Link>

          <nav className="order-3 flex w-full max-w-full gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] p-1 md:order-none md:w-auto">
            {clientNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
                    active && "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface-3)]"
              href="/dashboard"
            >
              <Building2 aria-hidden size={17} />
              Staff
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">{children}</main>
    </div>
  );
}
