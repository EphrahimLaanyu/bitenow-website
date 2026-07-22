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
  Users,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6 pb-20 pt-4">
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
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Revenue overview</h2>
            <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-200" type="button">
              Last 7 days
            </button>
          </div>
          <div className="mt-8 flex h-52 items-end gap-2 px-2">
            {barValues.map((value, index) => (
              <div className="group flex flex-1 flex-col items-center gap-3" key={barLabels[index]}>
                <div className="relative w-full max-w-[3rem] flex-1 rounded-t-md bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "absolute bottom-0 w-full rounded-t-md transition-all duration-500",
                      index === 5 ? "bg-slate-900" : "bg-slate-300 group-hover:bg-slate-400"
                    )}
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{barLabels[index]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Order status</h2>
            <Link className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 transition-colors hover:bg-slate-200" href="/dashboard/orders">
              View report
            </Link>
          </div>
          <StatusDonut total={data.orders.length} />
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
            <Link className="group flex items-center text-sm font-medium text-slate-600 hover:text-slate-900" href="/dashboard/orders">
              View all orders
              <ChevronRight aria-hidden size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-medium text-slate-500">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="px-4 pb-3 font-medium">Guest</th>
                  <th className="px-4 pb-3 font-medium">Items</th>
                  <th className="px-4 pb-3 font-medium">Total</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="pb-3 pl-4 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr className="transition-colors hover:bg-slate-50" key={order.id}>
                      <td className="py-3 pr-4 font-medium text-slate-900">{order.order_number}</td>
                      <td className="px-4 py-3 text-slate-600">{order.customer_name || "Walk-in"}</td>
                      <td className="px-4 py-3 text-slate-600">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatMoney(Number(order.total_amount ?? 0), data.activeHotel?.currency)}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent font-medium">{formatOrderStatus(order.status ?? "draft")}</Badge>
                      </td>
                      <td className="py-3 pl-4 text-right text-slate-500">{formatTime(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 text-center text-sm text-slate-500" colSpan={6}>
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Popular meals</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <CookingPot aria-hidden size={16} />
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {data.popularMeals.length > 0 ? (
                data.popularMeals.map((meal, index) => (
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50" key={meal.id}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{meal.name}</p>
                        <p className="text-xs text-slate-500">{meal.quantity} ordered today</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No meal ranking yet.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Active staff</h2>
              <Users aria-hidden className="text-slate-500" size={18} />
            </div>
            <div className="mt-4">
              <p className="text-4xl font-bold tracking-tight text-slate-900">{data.stats.activeStaff}</p>
              <p className="mt-2 text-sm text-slate-500">
                {formatRole(data.activeMembership?.role ?? "Staff")} access at {data.activeHotel?.name ?? "active hotel"}.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  sublabel,
  value,
  className
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  sublabel: string;
  value: number | string;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
          <Icon aria-hidden size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
    </Card>
  );
}

function StatusDonut({ total }: { total: number }) {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div
        className="relative grid h-48 w-48 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#0f172a 0 55%, #64748b 55% 76%, #cbd5e1 76% 90%, #f1f5f9 90% 100%)"
        }}
      >
        <div className="absolute inset-0 rounded-full border-[6px] border-white" />
        <div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center shadow-sm">
          <div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{total}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Orders</p>
          </div>
        </div>
      </div>
      <div className="mt-8 grid w-full grid-cols-2 gap-3 text-xs font-medium text-slate-600">
        <Legend color="#0f172a" label="Completed 55%" />
        <Legend color="#64748b" label="Preparing 21%" />
        <Legend color="#cbd5e1" label="Ready 14%" />
        <Legend color="#f1f5f9" label="Pending 10%" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function AlertMessage({ children, tone }: { children: React.ReactNode; tone: "danger" | "warning" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-3 text-sm font-medium shadow-sm",
        tone === "danger"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" key={index} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DATA LOADING & FORMATTING UTILS
// -------------------------------------------------------------

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