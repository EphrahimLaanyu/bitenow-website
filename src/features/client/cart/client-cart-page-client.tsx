"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ImageIcon, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import {
  CartItem,
  clearCart,
  getCartItems,
  getCartTotal,
  removeCartItem,
  updateCartItemNotes,
  updateCartItemQuantity
} from "@/features/client/cart/cart-storage";

export function ClientCartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);

  useEffect(() => {
    function syncCart() {
      setActiveHotelId(getActiveHotelId());
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

  const visibleItems = useMemo(
    () => (activeHotelId ? items.filter((item) => item.hotelId === activeHotelId) : items),
    [activeHotelId, items]
  );
  const total = getCartTotal(visibleItems);
  const currency = visibleItems[0]?.currency ?? "KES";
  const browseHref = activeHotelId ? `/client/hotels/${activeHotelId}/menu` : "/client/hotels";

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

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge>Guest cart</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">Your cart</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Review your selected items, adjust quantities, add notes, and continue to checkout.
          </p>
        </div>
        {visibleItems.length > 0 ? (
          <Button onClick={() => refreshCart(clearCart(activeHotelId))} type="button" variant="secondary">
            Clear cart
          </Button>
        ) : null}
      </section>

      {visibleItems.length === 0 ? (
        <Card className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
            <ShoppingCart aria-hidden size={28} />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-[var(--foreground)]">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            Add meals from a hotel menu and they will appear here before checkout.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
            href={browseHref}
          >
            Browse menu
            <ArrowRight aria-hidden size={18} />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {visibleItems.map((item) => {
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

          <Card className="h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Order summary</h2>
              <Badge>{visibleItems.length} item{visibleItems.length === 1 ? "" : "s"}</Badge>
            </div>
            <div className="mt-5 space-y-3 border-b border-[var(--border)] pb-5">
              {visibleItems.map((item) => (
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
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
              href="/client/checkout"
            >
              Continue to checkout
              <ArrowRight aria-hidden size={18} />
            </Link>
          </Card>
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
    <Card className="grid gap-4 md:grid-cols-[8rem_1fr_auto] md:items-start">
      {item.imageUrl ? (
        <div
          aria-label={item.name}
          className="h-32 rounded-md bg-[var(--surface-2)] bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${item.imageUrl}")` }}
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--muted)]">
          <ImageIcon aria-hidden size={30} />
        </div>
      )}

      <div className="min-w-0 space-y-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">{item.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatMoney(item.price, item.currency)}
            {item.prepTimeMinutes ? ` - ${item.prepTimeMinutes} min` : ""}
          </p>
        </div>
        <Textarea
          defaultValue={item.notes ?? ""}
          label="Item notes"
          onBlur={(event) => onChange(updateCartItemNotes(index, event.target.value))}
          placeholder="No onions, extra sauce, allergy notes..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <Button
          disabled={item.quantity <= 1}
          onClick={() => onChange(updateCartItemQuantity(index, item.quantity - 1))}
          type="button"
          variant="secondary"
        >
          <Minus aria-hidden size={16} />
        </Button>
        <span className="min-w-10 text-center text-sm font-bold text-[var(--foreground)]">{item.quantity}</span>
        <Button
          onClick={() => onChange(updateCartItemQuantity(index, item.quantity + 1))}
          type="button"
          variant="secondary"
        >
          <Plus aria-hidden size={16} />
        </Button>
        <Button onClick={() => onChange(removeCartItem(index))} type="button" variant="ghost">
          <Trash2 aria-hidden size={16} />
          Remove
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
