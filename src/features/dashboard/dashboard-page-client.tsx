"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  CookingPot,
  ReceiptText,
  Table2,
  Utensils,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import type { DiningTable, Hotel, HotelMembership, MenuItem, Order, Payment } from "@/lib/api/types";
import { getHotel, listHotels } from "@/features/hotels/api";
import { listMenuItems } from "@/features/menu/api";
import { listOrders } from "@/features/orders/api";
import { formatOrderStatus } from "@/features/orders/order-utils";
import { listPayments } from "@/features/payments/api";
import { listStaffMemberships } from "@/features/staff/api";
import { listTables } from "@/features/tables/api";

type DashboardState = {
  activeHotel: Hotel | null;
  activeMembership: HotelMembership | null;
  hotels: Hotel[];
  memberships: HotelMembership[];
  orders: Order[];
  popularMeals: PopularMeal[];
  statErrors: string[];
  stats: {
    activeStaff: number;
    availableTables: number;
    menuItems: number;
    occupiedTables: number;
    pendingOrders: number;
    revenue: number;
    tableTotal: number;
    todayOrders: number;
  };
};

type PopularMeal = {
  id: string;
  name: string;
  quantity: number;
};

const emptyState: DashboardState = {
  activeHotel: null,
  activeMembership: null,
  hotels: [],
  memberships: [],
  orders: [],
  popularMeals: [],
  statErrors: [],
  stats: {
    activeStaff: 0,
    availableTables: 0,
    menuItems: 0,
    occupiedTables: 0,
    pendingOrders: 0,
    revenue: 0,
    tableTotal: 0,
    todayOrders: 0
  }
};

const barValues = [34, 46, 38, 63, 50, 78, 68];
const barLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DashboardPageClient() {
  const { status } = useAuth();
  const [data, setData] = useState<DashboardState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadDashboard() {
      setError(null);
      setLoading(true);

      try {
        const membershipsResponse = await listStaffMemberships({ page_size: 50 });
        const memberships = membershipsResponse.results;
        const preferredHotelId = getActiveHotelId();
        const activeMembership =
          memberships.find(
            (membership) =>
              membership.is_active !== false &&
              (!preferredHotelId || membership.hotel === preferredHotelId)
          ) ??
          memberships.find((membership) => membership.is_active !== false) ??
          memberships[0] ??
          null;

        const hotelsLoad = await loadHotels(activeMembership);
        if (cancelled) return;

        const hotels = hotelsLoad.hotels;
        const activeHotel =
          hotels.find((hotel) => hotel.id === preferredHotelId) ??
          hotels.find((hotel) => hotel.id === activeMembership?.hotel) ??
          hotels[0] ??
          null;

        if (activeHotel) saveActiveHotelId(activeHotel.id);

        const operationsLoad = activeHotel
          ? await loadOperations(activeHotel.id)
          : {
              errors: [],
              menuItems: [] as MenuItem[],
              orders: [] as Order[],
              payments: [] as Payment[],
              tables: [] as DiningTable[]
            };

        if (cancelled) return;

        const activeHotelMemberships = memberships.filter(
          (membership) => membership.hotel === activeHotel?.id
        );

        setData({
          activeHotel,
          activeMembership,
          hotels,
          memberships,
          orders: operationsLoad.orders,
          popularMeals: getPopularMeals(operationsLoad.orders, operationsLoad.menuItems),
          statErrors: [
            ...(hotelsLoad.error ? [`Hotels: ${hotelsLoad.error}`] : []),
            ...operationsLoad.errors
          ],
          stats: buildStats(
            operationsLoad.orders,
            operationsLoad.payments,
            operationsLoad.tables,
            operationsLoad.menuItems,
            activeHotelMemberships
          )
        });
      } catch (dashboardError) {
        if (!cancelled) setError(getApiErrorMessage(dashboardError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const recentOrders = useMemo(() => data.orders.slice(0, 5), [data.orders]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      {error ? <AlertMessage tone="danger">{error}</AlertMessage> : null}
      {data.statErrors.length > 0 ? (
        <AlertMessage tone="warning">Some counts could not be loaded: {data.statErrors.join(" ")}</AlertMessage>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ReceiptText}
          label="Total revenue"
          sublabel="+12.4% this month"
          value={formatMoney(data.stats.revenue, data.activeHotel?.currency)}
        />
        <MetricCard icon={ClipboardList} label="Total orders" sublabel="+8.2% this month" value={data.orders.length} />
        <MetricCard
          icon={Table2}
          label="Active tables"
          sublabel={`${data.stats.availableTables} tables available`}
          value={`${data.stats.occupiedTables} / ${data.stats.tableTotal}`}
        />
        <MetricCard
          icon={Utensils}
          label="Menu items"
          sublabel={`${data.stats.menuItems === 0 ? 0 : Math.max(0, data.stats.menuItems - data.stats.menuItems)} unavailable`}
          value={data.stats.menuItems}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-[#101f3f]">Revenue overview</h2>
            <button className="text-xs font-bold text-[var(--accent)]" type="button">
              Last 7 days
            </button>
          </div>
          <div className="mt-10 flex h-56 items-end gap-3 border-b border-[#dbe3f1] px-2">
            {barValues.map((value, index) => (
              <div className="flex flex-1 flex-col items-center gap-3" key={barLabels[index]}>
                <div
                  className={`w-full max-w-20 rounded-t-md ${index === 5 ? "bg-[var(--accent)]" : "bg-[#c6d2e5]"}`}
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs font-semibold text-[var(--muted)]">{barLabels[index]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-[#101f3f]">Order status</h2>
            <Link className="text-xs font-bold text-[var(--accent)]" href="/orders">
              View report
            </Link>
          </div>
          <StatusDonut total={data.orders.length} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-[#101f3f]">Recent orders</h2>
            <Link className="text-xs font-bold text-[var(--accent)]" href="/orders">
              View all orders →
            </Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#dbe3f1] text-xs font-bold text-[var(--muted)]">
                <tr>
                  <th className="py-3 pr-4">Order</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="py-3 pl-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-4 pr-4 font-black text-[#101f3f]">{order.order_number}</td>
                      <td className="px-4 py-4 text-[var(--muted)]">{order.customer_name || "Walk-in"}</td>
                      <td className="px-4 py-4 text-[var(--muted)]">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-4 font-bold text-[#101f3f]">{formatMoney(Number(order.total_amount ?? 0), data.activeHotel?.currency)}</td>
                      <td className="px-4 py-4">
                        <Badge>{formatOrderStatus(order.status ?? "draft")}</Badge>
                      </td>
                      <td className="py-4 pl-4 text-[var(--muted)]">{formatTime(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-6 text-sm text-[var(--muted)]" colSpan={6}>
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black text-[#101f3f]">Popular meals</h2>
              <CookingPot aria-hidden className="text-[var(--accent)]" size={20} />
            </div>
            <div className="mt-5 space-y-3">
              {data.popularMeals.length > 0 ? (
                data.popularMeals.map((meal, index) => (
                  <div className="flex items-center justify-between rounded-xl border border-[#dbe3f1] p-3" key={meal.id}>
                    <div>
                      <p className="font-black text-[#101f3f]">{index + 1}. {meal.name}</p>
                      <p className="text-xs font-semibold text-[var(--muted)]">{meal.quantity} ordered today</p>
                    </div>
                    <Badge>{meal.quantity}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">No meal ranking yet.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black text-[#101f3f]">Active staff</h2>
              <Users aria-hidden className="text-[var(--accent)]" size={20} />
            </div>
            <p className="mt-5 text-4xl font-black text-[#101f3f]">{data.stats.activeStaff}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
              {formatRole(data.activeMembership?.role ?? "Staff")} access at {data.activeHotel?.name ?? "active hotel"}.
            </p>
          </Card>

          <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
            <div className="flex items-center gap-3">
              <AlertTriangle aria-hidden className="text-[var(--accent)]" size={20} />
              <p className="text-sm font-bold text-[var(--muted)]">Low stock is ready when inventory endpoints are added.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  sublabel,
  value
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  sublabel: string;
  value: number | string;
}) {
  return (
    <Card className="rounded-xl border-[#dbe3f1] bg-white p-5 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff0e7] text-[var(--accent)]">
          <Icon aria-hidden size={18} />
        </span>
      </div>
      <p className="mt-7 text-3xl font-black text-[#101f3f]">{value}</p>
      <p className="mt-4 text-xs font-semibold text-[var(--accent)]">{sublabel}</p>
    </Card>
  );
}

function StatusDonut({ total }: { total: number }) {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div
        className="grid h-44 w-44 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#101f3f 0 55%, #ff6208 55% 76%, #9baac3 76% 90%, #e6edf8 90% 100%)"
        }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
          <div>
            <p className="text-xl font-black text-[#101f3f]">{total}</p>
            <p className="text-sm font-black text-[#101f3f]">orders</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid w-full grid-cols-2 gap-3 text-xs font-semibold text-[var(--muted)]">
        <Legend color="#101f3f" label="Completed 55%" />
        <Legend color="#ff6208" label="Preparing 21%" />
        <Legend color="#9baac3" label="Ready 14%" />
        <Legend color="#e6edf8" label="Pending 10%" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function AlertMessage({ children, tone }: { children: React.ReactNode; tone: "danger" | "warning" }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        tone === "danger"
          ? "border-red-500/30 bg-red-50 text-red-700"
          : "border-[var(--accent)]/30 bg-[#fff0e7] text-[var(--accent)]"
      }`}
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-40 animate-pulse rounded-xl border border-[#dbe3f1] bg-white" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-80 animate-pulse rounded-xl border border-[#dbe3f1] bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-[#dbe3f1] bg-white" />
      </div>
    </div>
  );
}

async function loadHotels(activeMembership: HotelMembership | null) {
  try {
    const response = await listHotels({ page_size: 50 });
    return { error: null, hotels: response.results };
  } catch (error) {
    if (!activeMembership) {
      return { error: getApiErrorMessage(error), hotels: [] };
    }

    try {
      const hotel = await getHotel(activeMembership.hotel);
      return { error: getApiErrorMessage(error), hotels: [hotel] };
    } catch {
      return { error: getApiErrorMessage(error), hotels: [] };
    }
  }
}

async function loadOperations(hotelId: string) {
  const errors: string[] = [];
  const [ordersResult, paymentsResult, tablesResult, menuResult] = await Promise.allSettled([
    listOrders({ hotel: hotelId, ordering: "-created_at", page_size: 100 }),
    listPayments({ hotel: hotelId, ordering: "-created_at", page_size: 100 }),
    listTables({ hotel: hotelId, page_size: 100 }),
    listMenuItems({ hotel: hotelId, page_size: 100 })
  ]);

  if (ordersResult.status === "rejected") errors.push(`Orders: ${getApiErrorMessage(ordersResult.reason)}`);
  if (paymentsResult.status === "rejected") errors.push(`Payments: ${getApiErrorMessage(paymentsResult.reason)}`);
  if (tablesResult.status === "rejected") errors.push(`Tables: ${getApiErrorMessage(tablesResult.reason)}`);
  if (menuResult.status === "rejected") errors.push(`Menu: ${getApiErrorMessage(menuResult.reason)}`);

  return {
    errors,
    menuItems: menuResult.status === "fulfilled" ? menuResult.value.results : [],
    orders: ordersResult.status === "fulfilled" ? ordersResult.value.results : [],
    payments: paymentsResult.status === "fulfilled" ? paymentsResult.value.results : [],
    tables: tablesResult.status === "fulfilled" ? tablesResult.value.results : []
  };
}

function buildStats(
  orders: Order[],
  payments: Payment[],
  tables: DiningTable[],
  menuItems: MenuItem[],
  memberships: HotelMembership[]
) {
  const todayOrders = orders.filter((order) => isToday(order.created_at));
  const paidToday = payments.filter(
    (payment) => payment.status === "paid" && isToday(payment.paid_at ?? payment.created_at)
  );

  return {
    activeStaff: memberships.filter((membership) => membership.is_active !== false).length,
    availableTables: tables.filter((table) => table.status === "available").length,
    menuItems: menuItems.length,
    occupiedTables: tables.filter((table) => table.status === "occupied").length,
    pendingOrders: orders.filter((order) =>
      ["draft", "placed", "accepted", "in_preparation", "ready"].includes(order.status ?? "draft")
    ).length,
    revenue: paidToday.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    tableTotal: tables.length,
    todayOrders: todayOrders.length
  };
}

function getPopularMeals(orders: Order[], menuItems: MenuItem[]) {
  const menuById = new Map(menuItems.map((item) => [item.id, item.name]));
  const counts = new Map<string, PopularMeal>();

  orders.filter((order) => isToday(order.created_at)).forEach((order) => {
    order.items?.forEach((item) => {
      const current = counts.get(item.menu_item);
      counts.set(item.menu_item, {
        id: item.menu_item,
        name: menuById.get(item.menu_item) ?? item.menu_item,
        quantity: (current?.quantity ?? 0) + (item.quantity ?? 0)
      });
    });
  });

  return Array.from(counts.values())
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 5);
}

function isToday(value: string | null | undefined) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    currency,
    style: "currency"
  }).format(Number.isFinite(value) ? value : 0);
}

function formatRole(role: string) {
  return role.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-KE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
