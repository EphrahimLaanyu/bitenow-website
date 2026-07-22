"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, RefreshCw, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Order } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listOrders } from "@/features/orders/api";
import {
  formatMoney,
  formatOrderStatus,
  formatOrderType,
  getStatusClassName,
  sortOrders
} from "@/features/orders/order-utils";
import { ShinyText } from "@/components/ui/shiny-text";

const currentStatuses = new Set(["draft", "placed", "accepted", "in_preparation", "ready", "served"]);

export function ClientOrdersPageClient() {
  const { bootstrapSession, status, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setError(null);
    setLoading(true);

    const hotelId = getActiveHotelId();
    setActiveHotelId(hotelId);

    if (!hotelId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      if (status === "unauthenticated" && getAccessToken()) {
        await bootstrapSession();
      }

      const response = await listOrders({
        hotel: hotelId,
        ordering: "-created_at",
        page_size: 100
      });

      const ownOrders = user?.id
        ? response.results.filter((order) => !order.created_by || order.created_by === user.id)
        : response.results;

      setOrders(sortOrders(ownOrders));
    } catch (ordersError) {
      setError(getApiErrorMessage(ordersError));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id]);

  const currentOrders = useMemo(
    () => orders.filter((order) => currentStatuses.has(order.status ?? "draft")),
    [orders]
  );
  const previousOrders = useMemo(
    () => orders.filter((order) => !currentStatuses.has(order.status ?? "draft")),
    [orders]
  );

  return (
    <div className="space-y-7 min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border-amber-400/50">My orders</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
            Track your orders
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Follow current orders in real time and review previous meals from this hotel.
          </p>
        </div>

        <Button disabled={loading} onClick={loadOrders} type="button" variant="secondary">
          <RefreshCw aria-hidden size={18} />
          Refresh
        </Button>
      </section>

      {status === "checking" ? (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <p className="text-sm text-slate-400">Checking your session...</p>
        </Card>
      ) : null}

      {status === "unauthenticated" && !getAccessToken() ? (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100">Sign in to view orders</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your orders are attached to your authenticated BiteNow account.
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-amber-400 px-4 text-sm font-bold text-slate-950"
            href="/login?next=%2Fclient%2Forders"
          >
            Sign in
          </Link>
        </Card>
      ) : null}

      {!activeHotelId ? (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h2 className="text-lg font-bold text-slate-100">Choose a hotel first</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Open a hotel before viewing the orders connected to that dining session.
          </p>
          <Link className="mt-4 inline-flex items-center gap-2 font-bold text-amber-400 hover:text-amber-300" href="/client/hotels">
            Browse hotels
            <ArrowRight aria-hidden size={16} />
          </Link>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <OrderSection emptyText="No active orders yet." loading={loading} orders={currentOrders} title="Current orders" />
      <OrderSection emptyText="No previous orders yet." loading={loading} orders={previousOrders} title="Previous orders" />
    </div>
  );
}

function OrderSection({
  emptyText,
  loading,
  orders,
  title
}: {
  emptyText: string;
  loading: boolean;
  orders: Order[];
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList aria-hidden className="text-amber-400" size={20} />
        <h2 className="text-lg font-extrabold text-slate-100">{title}</h2>
        <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/50 hover:bg-amber-400/30">{orders.length}</Badge>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="h-32 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/70"
              key={index}
            />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="grid gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <ShoppingBag aria-hidden size={20} />
            </span>
            <p className="text-sm font-semibold text-slate-400">{emptyText}</p>
          </div>
        </Card>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = order.status ?? "draft";

  return (
    <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="truncate text-xl font-extrabold text-amber-400 hover:text-amber-300"
            href={`/client/orders/${order.id}`}
          >
            {order.order_number}
          </Link>
          <Badge className={getStatusClassName(status)}>
            <ShinyText>{formatOrderStatus(status)}</ShinyText>
          </Badge>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          {formatOrderType(order.order_type)} · {formatDate(order.created_at)}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {order.items?.length ?? 0} item{order.items?.length === 1 ? "" : "s"} · Total{" "}
          <span className="font-extrabold text-slate-100">
            {formatMoney(order.total_amount)}
          </span>
        </p>
      </div>

      <Link
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-bold text-slate-100 shadow-sm transition-colors hover:border-amber-400 hover:text-amber-400"
        href={`/client/orders/${order.id}`}
      >
        Details
        <ArrowRight aria-hidden size={16} />
      </Link>
    </Card>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
