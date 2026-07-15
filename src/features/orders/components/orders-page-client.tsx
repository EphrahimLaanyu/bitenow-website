"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChefHat, ClipboardList, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, Order } from "@/lib/api/types";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listHotels } from "@/features/hotels/api";
import { listOrders, updateOrderStatus } from "@/features/orders/api";
import {
  formatMoney,
  formatOrderStatus,
  formatOrderType,
  getNextOrderStatus,
  getStatusClassName,
  orderStatuses,
  sortOrders
} from "@/features/orders/order-utils";

export function OrdersPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadOrders(hotelIdOverride?: string) {
    setError(null);
    setLoading(true);

    try {
      const hotelsResponse = await listHotels({ page_size: 100 });
      const hotelResults = hotelsResponse.results;
      const activeHotelId = chooseActiveHotelId(
        hotelResults,
        hotelIdOverride || selectedHotelId || getActiveHotelId()
      );

      setHotels(hotelResults);
      setSelectedHotelId(activeHotelId);

      if (!activeHotelId) {
        setOrders([]);
        return;
      }

      saveActiveHotelId(activeHotelId);
      const ordersResponse = await listOrders({
        hotel: activeHotelId,
        ordering: "-created_at",
        page_size: 100
      });
      setOrders(sortOrders(ordersResponse.results));
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
  }, []);

  const selectedHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId),
    [hotels, selectedHotelId]
  );

  const statusCounts = useMemo(
    () =>
      orderStatuses.slice(0, 7).map((status) => ({
        ...status,
        count: orders.filter((order) => (order.status ?? "draft") === status.value).length
      })),
    [orders]
  );

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadOrders(hotelId);
  }

  async function handleAdvance(order: Order) {
    const currentStatus = order.status ?? "draft";
    const nextStatus = getNextOrderStatus(currentStatus);
    if (!nextStatus) return;

    setError(null);
    setBusyId(order.id);

    try {
      const updated = await updateOrderStatus(order.id, { status: nextStatus }, order.hotel);
      setOrders((current) => sortOrders(current.map((item) => (item.id === order.id ? updated : item))));
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge>Orders API</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Orders</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Create orders, track status from draft to completed, and keep kitchen work moving.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]" href="/orders/new">
              <Plus aria-hidden size={18} />
              New order
            </Link>
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]" href="/orders/kitchen">
              <ChefHat aria-hidden size={18} />
              Kitchen
            </Link>
            <Button disabled={loading} onClick={() => loadOrders()} type="button" variant="secondary">
              <RefreshCw aria-hidden size={18} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <Card>
        <Select
          disabled={loading || hotels.length === 0}
          label="Active hotel"
          onChange={(event) => handleHotelChange(event.target.value)}
          value={selectedHotelId}
        >
          <option value="">Select hotel</option>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
      </Card>

      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        {statusCounts.map((status) => (
          <Card key={status.value}>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{status.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{status.count}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Orders list</h2>
          <Badge>{orders.length}</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
                key={index}
              />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-3">
            {orders.map((order) => (
              <OrderRow
                busy={busyId === order.id}
                currency={selectedHotel?.currency}
                key={order.id}
                onAdvance={handleAdvance}
                order={order}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">No orders were returned for this hotel yet.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function OrderRow({
  busy,
  currency,
  onAdvance,
  order
}: {
  busy: boolean;
  currency?: string;
  onAdvance: (order: Order) => void;
  order: Order;
}) {
  const status = order.status ?? "draft";
  const nextStatus = getNextOrderStatus(status);

  return (
    <Card className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Order</p>
        <Link className="mt-2 block truncate text-lg font-bold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/orders/${order.id}`}>
          {order.order_number}
        </Link>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">
          {order.customer_name || "Walk-in customer"} · {formatOrderType(order.order_type)}
        </p>
      </div>
      <Badge className={getStatusClassName(status)}>{formatOrderStatus(status)}</Badge>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Table</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{order.table ?? "No table"}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Total</p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{formatMoney(order.total_amount, currency)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]" href={`/orders/${order.id}`}>
          Details
        </Link>
        <Button disabled={busy || !nextStatus} onClick={() => onAdvance(order)} type="button">
          {nextStatus ? `Mark ${formatOrderStatus(nextStatus)}` : "Done"}
        </Button>
      </div>
    </Card>
  );
}

function chooseActiveHotelId(hotels: Hotel[], preferredId: string | null) {
  if (preferredId && hotels.some((hotel) => hotel.id === preferredId)) {
    return preferredId;
  }

  return hotels[0]?.id ?? "";
}
