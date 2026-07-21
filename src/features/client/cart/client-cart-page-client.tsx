"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, ImageIcon, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CartItem,
  clearCart,
  getCartItems,
  getCartTotal,
  removeCartItem,
  updateCartItemNotes,
  updateCartItemQuantity
} from "@/features/client/cart/cart-storage";
import { listHotels } from "@/features/hotels/api";
import type { Hotel } from "@/lib/api/types";

export function ClientCartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function syncCart() {
      setItems(getCartItems());
    }

    syncCart();
    window.addEventListener("bitenow_cart_updated", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("bitenow_cart_updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    async function loadHotels() {
      try {
        const response = await listHotels({ page_size: 100 });
        setHotels(response.results);
      } catch (error) {
        console.error("Failed to load hotels for cart mapping", error);
      } finally {
        setLoading(false);
      }
    }
    void loadHotels();
  }, []);

  const hotelMap = useMemo(() => new Map(hotels.map((h) => [h.id, h])), [hotels]);

  // Group items by hotelId
  const groupedItems = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of items) {
      if (!groups.has(item.hotelId)) {
        groups.set(item.hotelId, []);
      }
      groups.get(item.hotelId)!.push(item);
    }
    return Array.from(groups.entries());
  }, [items]);

  function refreshCart(nextItems: CartItem[]) {
    setItems(nextItems);
  }

  function getGlobalIndex(item: CartItem) {
    return items.findIndex(
      (cartItem) =>
        cartItem.hotelId === item.hotelId &&
        cartItem.itemId === item.itemId &&
        cartItem.name === item.name &&
        (cartItem.notes ?? "") === (item.notes ?? "")
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 animate-pulse pb-20">
        <div className="h-24 w-full rounded-xl bg-slate-100" />
        <div className="h-64 w-full rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge>Guest cart</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">Your cart</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Review your selected items, adjust quantities, add notes, and continue to checkout.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <Card className="text-center py-16">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
            <ShoppingCart aria-hidden size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-[var(--foreground)]">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            Add meals from a hotel menu and they will appear here before checkout.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
            href="/client/menu"
          >
            Browse global menu
            <ArrowRight aria-hidden size={18} />
          </Link>
        </Card>
      ) : (
        <div className="space-y-12">
          {groupedItems.map(([hotelId, hotelItems]) => {
            const hotel = hotelMap.get(hotelId);
            const hotelName = hotel?.name ?? "Unknown Hotel";
            const total = getCartTotal(hotelItems);
            const currency = hotelItems[0]?.currency ?? hotel?.currency ?? "KES";

            return (
              <section key={hotelId} className="space-y-6 relative">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                      <Building2 aria-hidden size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{hotelName}</h2>
                      <p className="text-sm text-slate-500">{hotelItems.length} item{hotelItems.length === 1 ? "" : "s"} in this cart</p>
                    </div>
                  </div>
                  <Button onClick={() => refreshCart(clearCart(hotelId))} type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 aria-hidden size={16} className="mr-2" />
                    Clear this cart
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                  <div className="space-y-4">
                    {hotelItems.map((item) => {
                      const globalIndex = getGlobalIndex(item);
                      return (
                        <CartItemCard
                          index={globalIndex}
                          item={item}
                          key={`${item.hotelId}-${item.itemId}-${item.notes ?? "none"}`}
                          onChange={refreshCart}
                        />
                      );
                    })}
                  </div>

                  <Card className="h-fit shadow-sm border-slate-200 lg:sticky lg:top-24">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Order summary</h3>
                    </div>
                    <div className="mt-5 space-y-3 border-b border-[var(--border)] pb-5">
                      {hotelItems.map((item) => (
                        <div className="flex items-center justify-between gap-3 text-sm" key={`${item.itemId}-${item.notes ?? ""}`}>
                          <span className="truncate text-[var(--muted)]">
                            {item.quantity} x {item.name}
                          </span>
                          <span className="font-semibold text-[var(--foreground)]">{formatMoney(Number(item.price) * item.quantity, item.currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--muted)]">Estimated total</span>
                      <span className="text-2xl font-bold text-[var(--foreground)]">{formatMoney(total, currency)}</span>
                    </div>
                    <Link
                      className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
                      href={`/client/checkout?hotelId=${encodeURIComponent(hotelId)}`}
                    >
                      Checkout for {hotelName}
                      <ArrowRight aria-hidden size={18} />
                    </Link>
                  </Card>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartItemCard({
  index,
  item,
  onChange
}: {
  index: number;
  item: CartItem;
  onChange: (items: CartItem[]) => void;
}) {
  return (
    <Card className="grid gap-4 shadow-sm border-slate-200 md:grid-cols-[8rem_1fr_auto] md:items-start p-4">
      {item.imageUrl ? (
        <div
          aria-label={item.name}
          className="h-28 rounded-lg bg-[var(--surface-2)] bg-cover bg-center border border-slate-100"
          role="img"
          style={{ backgroundImage: `url("${item.imageUrl}")` }}
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)] border border-slate-100">
          <ImageIcon aria-hidden size={30} />
        </div>
      )}

      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">{item.name}</h3>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            {formatMoney(item.price, item.currency)}
            {item.prepTimeMinutes ? ` - ${item.prepTimeMinutes} min` : ""}
          </p>
        </div>
        <Textarea
          defaultValue={item.notes ?? ""}
          label="Item notes (optional)"
          onBlur={(event) => onChange(updateCartItemNotes(index, event.target.value))}
          placeholder="No onions, extra sauce, allergy notes..."
          className="h-10 text-sm placeholder:text-slate-400 focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
          <Button
            disabled={item.quantity <= 1}
            onClick={() => onChange(updateCartItemQuantity(index, item.quantity - 1))}
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-none rounded-l-lg p-0 hover:bg-slate-50"
          >
            <Minus aria-hidden size={14} />
          </Button>
          <span className="flex h-9 w-10 items-center justify-center text-sm font-bold text-[var(--foreground)] border-x border-slate-200">
            {item.quantity}
          </span>
          <Button
            onClick={() => onChange(updateCartItemQuantity(index, item.quantity + 1))}
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-none rounded-r-lg p-0 hover:bg-slate-50"
          >
            <Plus aria-hidden size={14} />
          </Button>
        </div>
        <Button onClick={() => onChange(removeCartItem(index))} type="button" variant="ghost" className="h-9 text-slate-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 aria-hidden size={16} />
        </Button>
      </div>
    </Card>
  );
}

function formatMoney(value: string | number | undefined, currency = "KES") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}
