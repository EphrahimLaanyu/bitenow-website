"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { DiningTable, OrderType } from "@/lib/api/types";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CartItem,
  clearCart,
  getCartItemsForHotel,
  getCartTotal
} from "@/features/client/cart/cart-storage";
import { createOrder } from "@/features/orders/api";
import { generateOrderNumber } from "@/features/orders/order-utils";
import { listTables } from "@/features/tables/api";

const orderTypes: Array<{ label: string; value: OrderType }> = [
  { label: "Dine In", value: "dine_in" },
  { label: "Takeaway", value: "takeaway" },
  { label: "Delivery", value: "delivery" }
];

export function ClientCheckoutPageClient() {
  const router = useRouter();
  const { bootstrapSession, status, user } = useAuth();
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [orderNumber] = useState(() => generateOrderNumber());
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setError(null);
      setLoading(true);

      const hotelId = getActiveHotelId();
      setActiveHotelId(hotelId);
      setItems(getCartItemsForHotel(hotelId));

      if (!hotelId) {
        setTables([]);
        setLoading(false);
        return;
      }

      try {
        const tablesResponse = await listTables({ hotel: hotelId, page_size: 100 });
        if (!cancelled) setTables(tablesResponse.results);
      } catch (tablesError) {
        if (!cancelled) setError(getApiErrorMessage(tablesError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCheckout();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated" && getAccessToken()) {
      void bootstrapSession();
    }
  }, [bootstrapSession, status]);

  const total = useMemo(() => getCartTotal(items), [items]);
  const currency = items[0]?.currency ?? "KES";
  const menuHref = activeHotelId ? `/client/hotels/${activeHotelId}/menu` : "/client/hotels";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setValidationErrors([]);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const hotelId = activeHotelId;
    const createdBy = user?.id;

    try {
      if (!hotelId) throw new Error("Choose a hotel before checkout.");
      if (items.length === 0) throw new Error("Add at least one item before checkout.");
      if (!createdBy) throw new Error("Please sign in before placing this order.");

      const selectedOrderType = String(formData.get("order_type") || "dine_in") as OrderType;
      const selectedTable = String(formData.get("table") || "").trim();

      if (selectedOrderType === "dine_in" && !selectedTable) {
        throw new Error("Select a table for dine-in orders.");
      }

      const order = await createOrder({
        created_by: createdBy,
        customer_name: getOptionalString(formData.get("customer_name")),
        customer_phone: getOptionalString(formData.get("customer_phone")),
        hotel: hotelId,
        items: items.map((item) => ({
          menu_item: item.itemId,
          notes: item.notes,
          quantity: item.quantity,
          unit_price: item.price
        })),
        notes: getOptionalString(formData.get("notes")),
        order_number: orderNumber,
        order_type: selectedOrderType,
        status: "placed",
        table: selectedOrderType === "dine_in" ? selectedTable : null
      });

      clearCart(hotelId);
      router.push(`/client/checkout/success?order=${encodeURIComponent(order.id)}&number=${encodeURIComponent(order.order_number)}`);
    } catch (checkoutError) {
      setError(getApiErrorMessage(checkoutError));
      setValidationErrors(getValidationErrors(checkoutError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)]" href="/client/cart">
        <ArrowLeft aria-hidden size={16} />
        Back to cart
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="space-y-6">
          <div>
            <Badge>Checkout</Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
              Place your order
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Confirm your order type, table, and notes before sending the order to the restaurant.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {validationErrors.length > 0 ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              <p className="font-bold">Validation errors</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {validationErrors.map((validationError) => (
                  <li key={validationError}>{validationError}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {status === "checking" ? (
            <Card>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Checking your session</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                We are confirming your sign-in before checkout.
              </p>
            </Card>
          ) : null}

          {status === "unauthenticated" && !getAccessToken() ? (
            <Card>
              <h2 className="text-lg font-bold text-[var(--foreground)]">Sign in required</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                The backend requires an authenticated user to place orders.
              </p>
              <Link
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)]"
                href="/login?next=%2Fclient%2Fcheckout"
              >
                Sign in to checkout
              </Link>
            </Card>
          ) : null}

          <Card>
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList aria-hidden className="text-[var(--primary)]" size={20} />
              <h2 className="text-lg font-bold text-[var(--foreground)]">Order details</h2>
            </div>

            <form className="grid gap-4 lg:grid-cols-2" id="client-checkout-form" onSubmit={handleSubmit}>
              <Input disabled label="Order number" name="order_number" value={orderNumber} />
              <Select
                disabled={submitting}
                label="Order type"
                name="order_type"
                onChange={(event) => setOrderType(event.target.value as OrderType)}
                value={orderType}
              >
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>

              {orderType === "dine_in" ? (
                <Select disabled={submitting || loading || tables.length === 0} label="Table" name="table" required>
                  <option value="">Select table</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.table_number}
                      {table.capacity ? ` - ${table.capacity} seats` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <input name="table" type="hidden" value="" />
              )}

              <Input disabled={submitting} label="Customer name" name="customer_name" placeholder="Optional" />
              <Input disabled={submitting} label="Customer phone" name="customer_phone" placeholder="Optional" />
              <div className="lg:col-span-2">
                <Textarea disabled={submitting} label="Order notes" name="notes" placeholder="Delivery notes, allergies, or special requests..." />
              </div>
            </form>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Review order</h2>
            <Badge>{items.length}</Badge>
          </div>

          {items.length > 0 ? (
            <div className="mt-5 space-y-3 border-b border-[var(--border)] pb-5">
              {items.map((item) => (
                <div className="flex items-start justify-between gap-3 text-sm" key={`${item.itemId}-${item.notes ?? ""}`}>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[var(--foreground)]">
                      {item.quantity} x {item.name}
                    </p>
                    {item.notes ? <p className="mt-1 text-xs text-[var(--muted)]">{item.notes}</p> : null}
                  </div>
                  <span className="font-bold text-[var(--foreground)]">
                    {formatMoney(Number(item.price) * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted)]">
              Your cart is empty.
              <Link className="ml-1 font-bold text-[var(--primary)]" href={menuHref}>
                Browse menu
              </Link>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--muted)]">Estimated total</span>
            <span className="text-2xl font-extrabold text-[var(--foreground)]">{formatMoney(total, currency)}</span>
          </div>

          <Button
            className="mt-6 w-full"
            disabled={submitting || loading || items.length === 0 || status === "checking" || !user?.id}
            form="client-checkout-form"
            type="submit"
          >
            {submitting ? "Submitting..." : "Submit order"}
            <ArrowRight aria-hidden size={18} />
          </Button>
        </Card>
      </section>
    </div>
  );
}

function getOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || undefined;
}

function getValidationErrors(error: unknown) {
  if (!(error instanceof ApiError)) return [];
  return flattenValidationDetails(error.details);
}

function flattenValidationDetails(details: unknown, path = ""): string[] {
  if (!details) return [];

  if (typeof details === "string") return [`${path || "detail"}: ${details}`];

  if (Array.isArray(details)) {
    return details.flatMap((item, index) =>
      flattenValidationDetails(item, path ? `${path}[${index}]` : `[${index}]`)
    );
  }

  if (typeof details === "object") {
    return Object.entries(details).flatMap(([key, value]) =>
      flattenValidationDetails(value, path ? `${path}.${key}` : key)
    );
  }

  return [`${path || "detail"}: ${String(details)}`];
}

function formatMoney(value: string | number | undefined, currency = "KES") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(amount) ? amount : 0);
}
