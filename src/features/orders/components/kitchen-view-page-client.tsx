"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChefHat, RefreshCw } from "lucide-react";
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
  activeKitchenStatuses,
  formatOrderStatus,
  formatOrderType,
  getNextOrderStatus,
  getStatusClassName,
  sortOrders
} from "@/features/orders/order-utils";

export function KitchenViewPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadKitchen(hotelIdOverride?: string) {
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
      setOrders(sortOrders(ordersResponse.results).filter((order) => activeKitchenStatuses.includes(order.status ?? "draft")));
    } catch (kitchenError) {
      setError(getApiErrorMessage(kitchenError));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKitchen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () =>
      activeKitchenStatuses.map((status) => ({
        label: formatOrderStatus(status),
        orders: orders.filter((order) => order.status === status),
        status
      })),
    [orders]
  );

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadKitchen(hotelId);
  }

  async function handleAdvance(order: Order) {
    const nextStatus = getNextOrderStatus(order.status ?? "draft");
    if (!nextStatus) return;

    setError(null);
    setBusyId(order.id);

    try {
      const updated = await updateOrderStatus(order.id, { status: nextStatus }, order.hotel);
      setOrders((current) =>
        sortOrders(current.map((item) => (item.id === order.id ? updated : item))).filter((item) =>
          activeKitchenStatuses.includes(item.status ?? "draft")
        )
      );
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]" href="/orders">
          <ArrowLeft aria-hidden size={16} />
          Back to orders
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge>Kitchen view</Badge>
            <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Kitchen</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Follow placed, accepted, preparing, and ready orders without completed work crowding the board.
            </p>
          </div>
          <Button disabled={loading} onClick={() => loadKitchen()} type="button" variant="secondary">
            <RefreshCw aria-hidden size={18} />
            Refresh
          </Button>
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

      {loading ? (
        <div className="grid gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-96 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-4">
          {columns.map((column) => (
            <Card className="min-h-96" key={column.status}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ChefHat aria-hidden className="text-[var(--accent)]" size={18} />
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{column.label}</h2>
                </div>
                <Badge>{column.orders.length}</Badge>
              </div>
              <div className="space-y-3">
                {column.orders.length ? (
                  column.orders.map((order) => (
                    <KitchenOrderCard
                      busy={busyId === order.id}
                      key={order.id}
                      onAdvance={handleAdvance}
                      order={order}
                    />
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">No orders.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenOrderCard({
  busy,
  onAdvance,
  order
}: {
  busy: boolean;
  onAdvance: (order: Order) => void;
  order: Order;
}) {
  const status = order.status ?? "draft";
  const nextStatus = getNextOrderStatus(status);

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link className="truncate text-base font-bold text-[var(--foreground)] hover:text-[var(--accent)]" href={`/orders/${order.id}`}>
            {order.order_number}
          </Link>
          <p className="mt-1 text-sm text-[var(--muted)]">{formatOrderType(order.order_type)}</p>
        </div>
        <Badge className={getStatusClassName(status)}>{formatOrderStatus(status)}</Badge>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">{order.customer_name || "Walk-in customer"}</p>
      {order.notes ? <p className="mt-2 text-sm text-[var(--accent)]">{order.notes}</p> : null}
      <Button className="mt-4 w-full" disabled={busy || !nextStatus} onClick={() => onAdvance(order)} type="button">
        {nextStatus ? `Mark ${formatOrderStatus(nextStatus)}` : "Done"}
      </Button>
    </div>
  );
}

function chooseActiveHotelId(hotels: Hotel[], preferredId: string | null) {
  if (preferredId && hotels.some((hotel) => hotel.id === preferredId)) {
    return preferredId;
  }

  return hotels[0]?.id ?? "";
}
