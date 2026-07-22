"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RefreshCw,
  Utensils,
  XCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { MenuItem, Order, OrderItem, OrderStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listMenuItems } from "@/features/menu/api";
import { getOrder, listOrderItems } from "@/features/orders/api";
import {
  formatMoney,
  formatOrderStatus,
  formatOrderType,
  getStatusClassName
} from "@/features/orders/order-utils";
import { DecryptedText } from "@/components/ui/decrypted-text";
import { MagicRings } from "@/components/ui/magic-rings";

const trackingStatuses: Array<{ label: string; value: OrderStatus }> = [
  { label: "Draft", value: "draft" },
  { label: "Placed", value: "placed" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "in_preparation" },
  { label: "Ready", value: "ready" },
  { label: "Served", value: "served" },
  { label: "Completed", value: "completed" }
];
const terminalStatuses = new Set<OrderStatus>(["completed", "cancelled"]);
const POLL_INTERVAL_MS = 15000;

export function ClientOrderDetailsPageClient({ orderId }: { orderId: string }) {
  const { bootstrapSession, status, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadOrder = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      setError(null);
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        if (status === "unauthenticated" && getAccessToken()) {
          await bootstrapSession();
        }

        const activeHotelId = getActiveHotelId();
        const loadedOrder = await getOrder(orderId, activeHotelId ?? undefined);

        if (user?.id && loadedOrder.created_by && loadedOrder.created_by !== user.id) {
          throw new Error("This order does not belong to the signed-in guest.");
        }

        saveActiveHotelId(loadedOrder.hotel);

        const [orderItemsResponse, menuItemsResponse] = await Promise.all([
          listOrderItems({ order: loadedOrder.id, page_size: 100 }, loadedOrder.hotel).catch(() => ({
            results: loadedOrder.items ?? []
          })),
          listMenuItems({ hotel: loadedOrder.hotel, page_size: 100 }).catch(() => ({ results: [] }))
        ]);

        setOrder(loadedOrder);
        setItems(orderItemsResponse.results);
        setMenuItems(menuItemsResponse.results);
        setLastUpdatedAt(new Date());
      } catch (orderError) {
        setError(getApiErrorMessage(orderError));
        if (!quiet) {
          setOrder(null);
          setItems([]);
          setMenuItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bootstrapSession, orderId, status, user?.id]
  );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order || terminalStatuses.has(order.status ?? "draft")) return;

    const intervalId = window.setInterval(() => {
      void loadOrder({ quiet: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadOrder, order]);

  const menuItemById = useMemo(
    () => new Map(menuItems.map((item) => [item.id, item])),
    [menuItems]
  );
  const statusValue = order?.status ?? "draft";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-40 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/70" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Order unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {error ?? "We could not load this order."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-7 min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <BackLink />

      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/50 hover:bg-amber-400/30">Order tracking</Badge>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-amber-400 md:text-5xl">
                <DecryptedText text={order.order_number} />
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {formatOrderType(order.order_type)} - {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusClassName(statusValue)}>{formatOrderStatus(statusValue)}</Badge>
              <Button disabled={refreshing} onClick={() => loadOrder({ quiet: true })} type="button" variant="secondary">
                <RefreshCw aria-hidden className={refreshing ? "animate-spin" : undefined} size={17} />
                Refresh
              </Button>
            </div>
          </div>

          <TerminalConfirmation status={statusValue} />

          <div className="mt-6">
            <StatusTimeline status={statusValue} />
            <p className="mt-4 text-xs font-semibold text-[var(--muted)]">
              Auto-refreshes every {POLL_INTERVAL_MS / 1000}s while the order is active.
              {lastUpdatedAt ? ` Last checked ${lastUpdatedAt.toLocaleTimeString()}.` : ""}
            </p>
          </div>

          {order.notes ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Order notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">{order.notes}</p>
            </div>
          ) : null}
        </Card>

        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2">
            <ReceiptText aria-hidden className="text-amber-400" size={20} />
            <h2 className="text-lg font-extrabold text-slate-100">Total</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(order.subtotal)} />
            <SummaryRow label="Tax" value={formatMoney(order.tax_amount)} />
            <SummaryRow label="Service charge" value={formatMoney(order.service_charge)} />
            <SummaryRow label="Discount" value={formatMoney(order.discount_amount)} />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
            <span className="text-sm font-bold text-slate-400">Total amount</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {formatMoney(order.total_amount)}
            </span>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Utensils aria-hidden className="text-amber-400" size={20} />
          <h2 className="text-lg font-extrabold text-slate-100">Items ordered</h2>
          <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/50 hover:bg-amber-400/30">{items.length}</Badge>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <OrderItemRow item={item} key={item.id} menuItem={menuItemById.get(item.menu_item)} />
            ))}
          </div>
        ) : (
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <p className="text-sm text-[var(--muted)]">No order items were returned for this order.</p>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock3 aria-hidden className="text-amber-400" size={20} />
          <h2 className="text-lg font-extrabold text-slate-100">Status history</h2>
        </div>

        {order.status_history && order.status_history.length > 0 ? (
          <div className="grid gap-3">
            {order.status_history.map((entry) => (
              <Card className="p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl" key={entry.id}>
                <p className="text-sm font-bold text-slate-100">
                  {formatOrderStatus(entry.from_status)} to {formatOrderStatus(entry.to_status)}
                </p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(entry.created_at)}</p>
                {entry.note ? <p className="mt-2 text-sm text-slate-400">{entry.note}</p> : null}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <p className="text-sm text-[var(--muted)]">No status history has been returned yet.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-400" href="/client/orders">
      <ArrowLeft aria-hidden size={16} />
      Back to my orders
    </Link>
  );
}

function TerminalConfirmation({ status }: { status: OrderStatus }) {
  if (!terminalStatuses.has(status)) return null;

  const completed = status === "completed";

  return (
    <div
      className={`mt-6 rounded-3xl border p-4 ${
        completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {completed ? (
          <CheckCircle2 aria-hidden className="mt-0.5 text-emerald-500" size={22} />
        ) : (
          <XCircle aria-hidden className="mt-0.5 text-red-500" size={22} />
        )}
        <div>
          <p className="font-extrabold text-[var(--foreground)]">
            {completed ? "Order completed" : "Order cancelled"}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {completed ? "Your order has been served and marked complete." : "This order is no longer active."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = trackingStatuses.findIndex((item) => item.value === status);

  if (status === "cancelled") {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <XCircle aria-hidden className="text-red-500" size={22} />
          <p className="text-sm font-bold text-slate-100">This order was cancelled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Current status</p>
          <p className="mt-1 text-lg font-extrabold text-amber-400">
            {formatOrderStatus(status)}
          </p>
        </div>
        <Badge className={getStatusClassName(status)}>{formatOrderStatus(status)}</Badge>
      </div>

      <ol className="mt-6 grid gap-3 md:grid-cols-7">
        {trackingStatuses.map((item, index) => {
          const complete = currentIndex >= index;
          const current = currentIndex === index;

          const StatusIcon = () => (
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${
                complete
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {index + 1}
            </span>
          );

          return (
            <li key={item.value}>
              <div
                className={`flex min-h-24 flex-col justify-between rounded-2xl border p-3 transition-colors ${
                  complete
                    ? "border-amber-400/30 bg-amber-400/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                {current ? (
                  <MagicRings>
                    <StatusIcon />
                  </MagicRings>
                ) : (
                  <StatusIcon />
                )}
                <div className="mt-4">
                  <p className="text-sm font-extrabold text-slate-100">{item.label}</p>
                  {current ? <p className="mt-1 text-xs font-bold text-amber-400">Now</p> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OrderItemRow({ item, menuItem }: { item: OrderItem; menuItem?: MenuItem }) {
  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-extrabold text-amber-400">
          {menuItem?.name ?? item.menu_item}
        </h3>
        {item.notes ? <p className="mt-1 text-sm text-slate-400">{item.notes}</p> : null}
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">Quantity</p>
        <p className="mt-1 text-sm font-extrabold text-slate-100">{item.quantity ?? 0}</p>
      </div>
      <div className="md:text-right">
        <p className="text-xs font-bold uppercase text-slate-400">Line total</p>
        <p className="mt-1 text-sm font-extrabold text-amber-400">
          {formatMoney(item.line_total ?? Number(item.unit_price) * (item.quantity ?? 0))}
        </p>
      </div>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-slate-100">{value}</span>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
