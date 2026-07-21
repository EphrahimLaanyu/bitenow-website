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
    <div className="space-y-6 md:space-y-8">
      <div>
        <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
          Orders API
        </Badge>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-base text-slate-500">
            Create orders, track status from draft to completed, and keep kitchen work moving.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 shadow-sm"
              href="/orders/new"
            >
              <Plus aria-hidden size={18} />
              New order
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
              href="/orders/kitchen"
            >
              <ChefHat aria-hidden size={18} className="text-slate-500" />
              Kitchen
            </Link>
            <Button
              className="h-10 rounded-lg font-medium shadow-sm"
              disabled={loading}
              onClick={() => loadOrders()}
              type="button"
              variant="secondary"
            >
              <RefreshCw aria-hidden size={16} className="mr-2 text-slate-500" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {statusCounts.map((status) => (
          <Card key={status.value} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{status.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{status.count}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500">
            <ClipboardList aria-hidden size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Orders list</h2>
          <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
            {orders.length}
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50"
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
          <Card className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">No orders were returned for this hotel yet.</p>
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
    <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md grid gap-4 lg:gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Order</p>
        <Link className="mt-1.5 block truncate text-base font-semibold text-slate-900 transition-colors hover:text-[var(--accent)]" href={`/orders/${order.id}`}>
          {order.order_number}
        </Link>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          {order.customer_name || "Walk-in customer"} &middot; {formatOrderType(order.order_type)}
        </p>
      </div>
      <div>
        <Badge className={`font-medium ${getStatusClassName(status)}`}>
          {formatOrderStatus(status)}
        </Badge>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Table</p>
        <p className="mt-1.5 text-sm font-medium text-slate-900">{order.table ?? "No table"}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</p>
        <p className="mt-1.5 text-sm font-medium text-slate-900">{formatMoney(order.total_amount, currency)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
          href={`/orders/${order.id}`}
        >
          Details
        </Link>
        <Button
          className="h-9 rounded-lg font-medium shadow-sm"
          disabled={busy || !nextStatus}
          onClick={() => onAdvance(order)}
          type="button"
        >
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