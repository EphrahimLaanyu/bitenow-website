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
import { getAccessToken } from "@/lib/auth/token-storage";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list";
import { CountUp } from "@/components/ui/count-up";

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
        if (!getAccessToken()) {
          // No token — skip the API call; hotel names will fall back to "Unknown Hotel"
          return;
        }
        const response = await listHotels({ page_size: 100 });
        setHotels(response.results);
      } catch {
        // Silently ignore — cart still works, hotel names just show fallback
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
    <div className="space-y-8 pb-20 min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border-amber-400/50">Guest cart</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-100 md:text-4xl">Your cart</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Review your selected items, adjust quantities, add notes, and continue to checkout.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <Card className="text-center py-16 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-amber-400">
            <ShoppingCart aria-hidden size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-amber-400">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Add meals from a hotel menu and they will appear here before checkout.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-500"
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
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                      <Building2 aria-hidden size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-amber-400">{hotelName}</h2>
                      <p className="text-sm text-slate-400">{hotelItems.length} item{hotelItems.length === 1 ? "" : "s"} in this cart</p>
                    </div>
                  </div>
                  <Button onClick={() => refreshCart(clearCart(hotelId))} type="button" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/20">
                    <Trash2 aria-hidden size={16} className="mr-2" />
                    Clear this cart
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
                  <AnimatedList className="space-y-4">
                    {hotelItems.map((item) => {
                      const globalIndex = getGlobalIndex(item);
                      return (
                        <AnimatedListItem key={`${item.hotelId}-${item.itemId}-${item.notes ?? "none"}`}>
                          <CartItemCard
                            index={globalIndex}
                            item={item}
                            onChange={refreshCart}
                          />
                        </AnimatedListItem>
                      );
                    })}
                  </AnimatedList>

                  <Card className="h-fit shadow-sm border border-white/10 bg-black/40 backdrop-blur-xl lg:sticky lg:top-24">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-100">Order summary</h3>
                    </div>
                    <div className="mt-5 space-y-3 border-b border-white/10 pb-5">
                      {hotelItems.map((item) => (
                        <div className="flex items-center justify-between gap-3 text-sm" key={`${item.itemId}-${item.notes ?? ""}`}>
                          <span className="truncate text-slate-400">
                            {item.quantity} x {item.name}
                          </span>
                          <span className="font-semibold text-slate-200">{formatMoney(Number(item.price) * item.quantity, item.currency)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-400">Estimated total</span>
                      <span className="text-2xl font-bold text-amber-400">
                        <CountUp value={total} currency={currency} />
                      </span>
                    </div>
                    <Link
                      className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-500 hover:scale-[1.02]"
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
    <Card className="grid gap-4 shadow-sm border border-white/10 bg-black/40 backdrop-blur-xl rounded-2xl md:grid-cols-[8rem_1fr_auto] md:items-start p-4">
      {item.imageUrl ? (
        <div
          aria-label={item.name}
          className="h-28 rounded-lg bg-slate-800 bg-cover bg-center border border-white/10"
          role="img"
          style={{ backgroundImage: `url("${item.imageUrl}")` }}
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg bg-slate-800 text-slate-500 border border-white/10">
          <ImageIcon aria-hidden size={30} />
        </div>
      )}

      <div className="min-w-0 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-amber-400">{item.name}</h3>
          <p className="mt-1 text-sm font-medium text-slate-400">
            {formatMoney(item.price, item.currency)}
            {item.prepTimeMinutes ? ` - ${item.prepTimeMinutes} min` : ""}
          </p>
        </div>
        <Textarea
          defaultValue={item.notes ?? ""}
          label="Item notes (optional)"
          onBlur={(event) => onChange(updateCartItemNotes(index, event.target.value))}
          placeholder="No onions, extra sauce, allergy notes..."
          className="h-10 text-sm bg-black/20 border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-amber-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="flex items-center rounded-lg border border-white/10 bg-black/20 shadow-sm">
          <Button
            disabled={item.quantity <= 1}
            onClick={() => onChange(updateCartItemQuantity(index, item.quantity - 1))}
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-none rounded-l-lg p-0 hover:bg-white/10 text-slate-200"
          >
            <Minus aria-hidden size={14} />
          </Button>
          <span className="flex h-9 w-10 items-center justify-center text-sm font-bold text-amber-400 border-x border-white/10">
            {item.quantity}
          </span>
          <Button
            onClick={() => onChange(updateCartItemQuantity(index, item.quantity + 1))}
            type="button"
            variant="ghost"
            className="h-9 w-9 rounded-none rounded-r-lg p-0 hover:bg-white/10 text-slate-200"
          >
            <Plus aria-hidden size={14} />
          </Button>
        </div>
        <Button onClick={() => onChange(removeCartItem(index))} type="button" variant="ghost" className="h-9 text-slate-500 hover:text-red-400 hover:bg-red-400/20">
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
