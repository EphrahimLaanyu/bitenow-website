"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChefHat, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6 pb-20 pt-4">
      <div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900" href="/orders">
          <ArrowLeft aria-hidden size={16} />
          Back to orders
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent shadow-none">
              Kitchen view
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Kitchen</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Follow placed, accepted, preparing, and ready orders without completed work crowding the board.
            </p>
          </div>
          <Button disabled={loading} onClick={() => loadKitchen()} type="button" variant="secondary" className="text-slate-700">
            <RefreshCw aria-hidden size={16} className={cn("mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-900 shadow-sm">
          {error}
        </div>
      ) : null}

      <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-[32rem] animate-pulse rounded-xl border border-slate-200 bg-slate-100" key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => (
            <Card className="flex min-h-[32rem] flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm" key={column.status}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200/50 text-slate-600">
                    <ChefHat aria-hidden size={16} />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900">{column.label}</h2>
                </div>
                <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-transparent shadow-none">
                  {column.orders.length}
                </Badge>
              </div>
              <div className="flex-1 space-y-3">
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
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-transparent">
                    <p className="text-xs font-medium text-slate-400">No orders.</p>
                  </div>
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
    <div className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        {/* ADDED: flex-1 to the container */}
        <div className="min-w-0 flex-1">
          <Link 
            // ADDED: 'block' so 'truncate' works correctly, and added a title attribute so hover shows full text
            className="block truncate text-sm font-bold text-slate-900 transition-colors hover:text-slate-600" 
            href={`/orders/${order.id}`}
            title={order.order_number} 
          >
            {order.order_number}
          </Link>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{formatOrderType(order.order_type)}</p>
        </div>
        {/* ADDED: shrink-0 so the badge always keeps its shape */}
        <Badge className={cn("shrink-0 shadow-none", getStatusClassName(status))}>
          {formatOrderStatus(status)}
        </Badge>
      </div>
      
      <p className="mt-3 text-sm font-medium text-slate-700">
        {order.customer_name || "Walk-in customer"}
      </p>
      
      {order.notes ? (
        <div className="mt-3 rounded-lg border border-amber-200/60 bg-amber-50 px-3 py-2">
          <p className="text-xs font-medium text-amber-900">{order.notes}</p>
        </div>
      ) : null}
      
      <Button 
        className="mt-4 w-full shadow-sm" 
        disabled={busy || !nextStatus} 
        onClick={() => onAdvance(order)} 
        type="button"
      >
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