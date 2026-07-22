"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardList, CreditCard, DoorOpen } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useAnimation } from "framer-motion";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { DiningTable, OrderType } from "@/lib/api/types";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { Badge } from "@/components/ui/badge";
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
  const searchParams = useSearchParams();
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
  const [paymentMethod, setPaymentMethod] = useState("room");

  useEffect(() => {
    let cancelled = false;

    async function loadCheckout() {
      setError(null);
      setLoading(true);

      const urlHotelId = searchParams.get("hotelId");
      const hotelId = urlHotelId || getActiveHotelId();
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
  }, [searchParams]);

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
    <div className="space-y-6 min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-400" href="/client/cart">
        <ArrowLeft aria-hidden size={16} />
        Back to cart
      </Link>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="space-y-6">
          <div>
            <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/50 hover:bg-amber-400/30">Checkout</Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
              Place your order
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
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
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h2 className="text-lg font-bold text-slate-100">Checking your session</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                We are confirming your sign-in before checkout.
              </p>
            </Card>
          ) : null}

          {status === "unauthenticated" && !getAccessToken() ? (
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
              <h2 className="text-lg font-bold text-slate-100">Sign in required</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The backend requires an authenticated user to place orders.
              </p>
              <Link
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-amber-400 px-4 text-sm font-bold text-slate-950"
                href="/login?next=%2Fclient%2Fcheckout"
              >
                Sign in to checkout
              </Link>
            </Card>
          ) : null}

          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList aria-hidden className="text-amber-400" size={20} />
              <h2 className="text-lg font-bold text-slate-100">Order details</h2>
            </div>

            <form className="grid gap-4 lg:grid-cols-2" id="client-checkout-form" onSubmit={handleSubmit}>
              <Input disabled label="Order number" name="order_number" value={orderNumber} className="bg-black/20 border-white/10 text-slate-200" />
              <Select
                disabled={submitting}
                label="Order type"
                name="order_type"
                onChange={(event) => setOrderType(event.target.value as OrderType)}
                value={orderType}
                className="bg-black/20 border-white/10 text-slate-200"
              >
                {orderTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>

              {orderType === "dine_in" ? (
                <Select disabled={submitting || loading || tables.length === 0} label="Table" name="table" required className="bg-black/20 border-white/10 text-slate-200">
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

              <Input disabled={submitting} label="Customer name" name="customer_name" placeholder="Optional" className="bg-black/20 border-white/10 text-slate-200" />
              <Input disabled={submitting} label="Customer phone" name="customer_phone" placeholder="Optional" className="bg-black/20 border-white/10 text-slate-200" />
              <div className="lg:col-span-2">
                <Textarea disabled={submitting} label="Order notes" name="notes" placeholder="Delivery notes, allergies, or special requests..." className="bg-black/20 border-white/10 text-slate-200" />
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Payment Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <TiltCard 
                title="Room 304" 
                icon={DoorOpen} 
                selected={paymentMethod === "room"} 
                onClick={() => setPaymentMethod("room")} 
              />
              <TiltCard 
                title="Credit Card" 
                icon={CreditCard} 
                selected={paymentMethod === "card"} 
                onClick={() => setPaymentMethod("card")} 
              />
            </div>
          </div>
        </div>

        <Card className="h-fit lg:sticky lg:top-24 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-100">Review order</h2>
            <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/50">{items.length}</Badge>
          </div>

          {items.length > 0 ? (
            <div className="mt-5 space-y-3 border-b border-white/10 pb-5">
              {items.map((item) => (
                <div className="flex items-start justify-between gap-3 text-sm" key={`${item.itemId}-${item.notes ?? ""}`}>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-100">
                      {item.quantity} x {item.name}
                    </p>
                    {item.notes ? <p className="mt-1 text-xs text-slate-400">{item.notes}</p> : null}
                  </div>
                  <span className="font-bold text-slate-200">
                    {formatMoney(Number(item.price) * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
              Your cart is empty.
              <Link className="ml-1 font-bold text-amber-400 hover:text-amber-300" href={menuHref}>
                Browse menu
              </Link>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-400">Estimated total</span>
            <span className="text-2xl font-extrabold text-amber-400">{formatMoney(total, currency)}</span>
          </div>

          <SubmitButton 
            disabled={loading || items.length === 0 || status === "checking" || !user?.id}
            submitting={submitting}
          />
        </Card>
      </section>
    </div>
  );
}

interface TiltCardProps {
  title: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
}

function TiltCard({ title, selected, onClick, icon: Icon }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`group relative h-32 w-full rounded-2xl p-4 cursor-pointer transition-colors border ${
        selected ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-black/40 hover:bg-black/60"
      }`}
    >
      <div style={{ transform: "translateZ(30px)" }} className="flex h-full flex-col items-center justify-center gap-3">
        <Icon className={selected ? "text-amber-400" : "text-slate-400"} size={32} />
        <span className={`font-bold ${selected ? "text-amber-400" : "text-slate-300"}`}>{title}</span>
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 mix-blend-overlay transition-opacity group-hover:opacity-100"
      />
    </motion.div>
  );
}

function SubmitButton({ submitting, disabled }: { submitting: boolean; disabled: boolean }) {
  const controls = useAnimation();

  const handleClick = async () => {
    if (disabled || submitting) return;
    await controls.start({
      scale: [1, 0.95, 1],
      boxShadow: [
        "0px 0px 0px 0px rgba(251,191,36,0)",
        "0px 0px 20px 5px rgba(251,191,36,0.6)",
        "0px 0px 0px 0px rgba(251,191,36,0)"
      ],
      transition: { duration: 0.4 }
    });
  };

  return (
    <motion.button
      type="submit"
      form="client-checkout-form"
      disabled={disabled || submitting}
      onClick={handleClick}
      animate={controls}
      className="group relative mt-6 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-amber-400 px-6 font-bold text-slate-950 transition-all hover:bg-amber-500 disabled:opacity-50"
    >
      <span className="relative z-10 flex items-center gap-2">
        {submitting ? "Submitting..." : "Submit order"}
        <ArrowRight aria-hidden size={18} />
      </span>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
        className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
      />
      <div className="absolute inset-0 rounded-xl border border-white/40 mix-blend-overlay" />
    </motion.button>
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
