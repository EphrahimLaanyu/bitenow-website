"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  Hotel,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  User
} from "lucide-react";
import { getCartItems, getCartItemsForHotel } from "@/features/client/cart/cart-storage";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { cn } from "@/lib/utils";

const primaryNavItems = [
  { href: "/client/hotels", label: "Hotels", icon: Hotel },
  { href: "/client/menu", label: "Menu", icon: Menu },
  { href: "/client/orders", label: "Orders", icon: ClipboardList },
  { href: "/client/checkout", label: "Checkout", icon: CreditCard }
];

const actionNavItems = [
  { href: "/client/notifications", label: "Notifications", icon: Bell },
  { href: "/client/profile", label: "Profile", icon: User }
];

const mobileNavItems = [
  { href: "/client/hotels", label: "Hotels", icon: Search },
  { href: "/client/menu", label: "Menu", icon: Menu },
  { href: "/client/cart", label: "Cart", icon: ShoppingCart, cart: true },
  { href: "/client/orders", label: "Orders", icon: ClipboardList },
  { href: "/client/profile", label: "Profile", icon: User }
];

export function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const cartCount = useCartCount();

  return (
    <div className="app-shell selection:bg-[#f97316] selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b border-[#101f3f]/5 bg-white/80 px-4 py-4 antialiased backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          
          {/* LOGO AREA */}
          <Link className="group flex min-w-0 items-center gap-3" href="/client/hotels">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#101f3f]/10 bg-[#101f3f]/[0.03] text-[#101f3f] shadow-[inset_0_1px_1px_rgba(255,255,255,1)] transition-all duration-500 ease-out group-hover:rotate-12 group-hover:scale-105 group-hover:border-[#f97316]/20 group-hover:bg-[#f97316]/10 group-hover:text-[#f97316]">
              <Utensils aria-hidden size={18} />
            </span>
            <div className="min-w-0">
              <p className="brand-logo font-display truncate text-2xl font-extrabold tracking-tight text-[#101f3f] transition-opacity group-hover:opacity-90">
                Bite<span className="text-[#f97316] transition-colors duration-500 group-hover:text-[#101f3f]">Now</span>
              </p>
              <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#101f3f]/40">Order fast. Eat now.</p>
            </div>
          </Link>

          {/* DESKTOP PRIMARY NAV */}
          <nav aria-label="Guest navigation" className="hidden items-center gap-9 lg:flex">
            {primaryNavItems.map((item) => (
              <NavPill active={isActivePath(pathname, item.href)} item={item} key={item.href} />
            ))}
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="flex items-center gap-3">
            
            <Link
              aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className={cn(
                "relative inline-flex h-11 items-center justify-center gap-2.5 rounded-full border border-[#101f3f]/10 bg-white px-5 text-[13px] font-bold tracking-wide text-[#101f3f] shadow-sm transition-all duration-300 ease-out hover:scale-105 hover:border-[#101f3f]/20 hover:bg-[#fafbfc] hover:shadow-md active:scale-95",
                isActivePath(pathname, "/client/cart") && "border-transparent bg-[#101f3f] text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] hover:bg-[#f97316] hover:text-white"
              )}
              href="/client/cart"
            >
              <ShoppingBag aria-hidden size={17} />
              <span className="hidden xl:inline">Cart</span>
              {cartCount > 0 ? <CartBadge count={cartCount} /> : null}
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {actionNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-label={item.label}
                    className={cn(
                      "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#101f3f]/10 bg-white text-[#101f3f]/50 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#101f3f]/20 hover:text-[#f97316] hover:shadow-md",
                      active && "border-transparent bg-[#101f3f] text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] hover:text-white"
                    )}
                    href={item.href}
                    key={item.href}
                    title={item.label}
                  >
                    <Icon aria-hidden size={18} />
                  </Link>
                );
              })}
            </div>

            <Link
              className="hidden h-11 items-center justify-center gap-2.5 rounded-full bg-[#f97316] px-6 text-[13px] font-bold tracking-wide text-white shadow-[0_6px_20px_rgba(249,115,22,0.25)] transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ea6505] hover:shadow-[0_8px_25px_rgba(249,115,22,0.35)] active:scale-95 sm:inline-flex"
              href="/dashboard"
            >
              <Building2 aria-hidden size={17} />
              Staff
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-6 lg:px-8 lg:pb-8">{children}</main>
      <MobileBottomNav cartCount={cartCount} pathname={pathname} />
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function NavPill({
  active,
  item
}: {
  active: boolean;
  item: { href: string; icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean; className?: string }>; label: string };
}) {
  const Icon = item.icon;

  return (
    <Link
      className={cn(
        "group inline-flex h-10 items-center gap-2.5 text-[13px] font-bold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]",
        active && "text-[#f97316]"
      )}
      href={item.href}
    >
      <Icon aria-hidden size={17} className={cn("transition-transform duration-300 group-hover:scale-110", active && "scale-110")} />
      {item.label}
    </Link>
  );
}

function MobileBottomNav({ cartCount, pathname }: { cartCount: number; pathname: string }) {
  return (
    <nav
      aria-label="Mobile guest navigation"
      className="fixed inset-x-4 bottom-4 z-50 rounded-[2rem] border border-[#101f3f]/5 bg-white/90 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              className={cn(
                "relative flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-[1.5rem] text-[10px] font-bold tracking-wide text-[#101f3f]/50 transition-all duration-300 hover:bg-[#101f3f]/[0.03] hover:text-[#101f3f]",
                active && "bg-[#101f3f] text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] hover:bg-[#101f3f] hover:text-white"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden size={18} className={cn("transition-transform duration-300", active && "scale-110")} />
              <span>{item.label}</span>
              {item.cart && cartCount > 0 ? <CartBadge count={cartCount} compact /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CartBadge({ compact = false, count }: { compact?: boolean; count: number }) {
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "absolute flex min-w-[20px] items-center justify-center rounded-full bg-[#f97316] px-1.5 text-[10px] font-extrabold leading-5 text-white shadow-sm ring-2 ring-white transition-transform duration-300",
        compact ? "right-2.5 top-2.5" : "-right-1.5 -top-1.5"
      )}
    >
      {label}
    </span>
  );
}

// -------------------------------------------------------------
// HOOKS & UTILS
// -------------------------------------------------------------

function useCartCount() {
  const [count, setCount] = useState(0);

  const syncCart = useMemo(
    () => () => {
      const activeHotelId = getActiveHotelId();
      const items = activeHotelId ? getCartItemsForHotel(activeHotelId) : getCartItems();
      setCount(items.reduce((sum, item) => sum + item.quantity, 0));
    },
    []
  );

  useEffect(() => {
    syncCart();
    window.addEventListener("bitenow_cart_updated", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("bitenow_cart_updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, [syncCart]);

  return count;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}