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
    <div className="space-y-8 pb-20 pt-4">
      <div className="flex flex-col gap-2">
        <h1 className="animate-fade-in-up font-display text-4xl font-black tracking-tight text-[#101f3f]">
          Good morning.
        </h1>
        <p className="animate-fade-in-up delay-100 text-[15px] font-semibold text-[var(--muted)]">
          Here is what's happening at {data.activeHotel?.name ?? "your hotel"} today.
        </p>
      </div>

      {error ? <AlertMessage tone="danger">{error}</AlertMessage> : null}
      {data.statErrors.length > 0 ? (
        <AlertMessage tone="warning">Some counts could not be loaded: {data.statErrors.join(" ")}</AlertMessage>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          className="animate-fade-in-up delay-100"
          icon={ReceiptText}
          label="Total revenue"
          sublabel="+12.4% this month"
          value={formatMoney(data.stats.revenue, data.activeHotel?.currency)}
        />
        <MetricCard className="animate-fade-in-up delay-200" icon={ClipboardList} label="Total orders" sublabel="+8.2% this month" value={data.orders.length} />
        <MetricCard
          className="animate-fade-in-up delay-300"
          icon={Table2}
          label="Active tables"
          sublabel={`${data.stats.availableTables} tables available`}
          value={`${data.stats.occupiedTables} / ${data.stats.tableTotal}`}
        />
        <MetricCard
          className="animate-fade-in-up delay-400"
          icon={Utensils}
          label="Menu items"
          sublabel={`${data.stats.menuItems === 0 ? 0 : Math.max(0, data.stats.menuItems - data.stats.menuItems)} unavailable`}
          value={data.stats.menuItems}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="glass-panel animate-fade-in-up delay-300 rounded-[2rem] p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[#101f3f]">Revenue overview</h2>
            <button className="rounded-full bg-[#101f3f]/[0.03] px-4 py-1.5 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white" type="button">
              Last 7 days
            </button>
          </div>
          <div className="mt-12 flex h-64 items-end gap-4 px-2">
            {barValues.map((value, index) => (
              <div className="flex flex-1 flex-col items-center gap-4 group" key={barLabels[index]}>
                <div className="relative w-full max-w-[4rem] flex-1 rounded-2xl bg-[#f4f7fd] overflow-hidden shadow-inner transition-transform duration-300 group-hover:scale-[1.02]">
                  <div
                    className={cn(
                      "absolute bottom-0 w-full rounded-2xl animate-grow-up",
                      index === 5 ? "bg-gradient-to-t from-[#ff6208] to-[#ff8c4a]" : "bg-gradient-to-t from-[#c6d2e5] to-[#dce5f3]"
                    )}
                    style={{ height: `${value}%`, animationDelay: `${index * 100}ms` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-[var(--muted)]">{barLabels[index]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel animate-fade-in-up delay-400 rounded-[2rem] p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[#101f3f]">Order status</h2>
            <Link className="rounded-full bg-[#101f3f]/[0.03] px-4 py-1.5 text-xs font-bold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white" href="/dashboard/orders">
              View report
            </Link>
          </div>
          <StatusDonut total={data.orders.length} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="glass-panel animate-fade-in-up delay-500 rounded-[2rem] p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[#101f3f]">Recent orders</h2>
            <Link className="group flex items-center text-xs font-bold text-[var(--accent)]" href="/dashboard/orders">
              View all orders
              <ChevronRight aria-hidden size={14} className="ml-1 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b-2 border-[#101f3f]/5 text-[11px] uppercase tracking-widest font-extrabold text-[#101f3f]/40">
                <tr>
                  <th className="py-4 pr-4">Order</th>
                  <th className="px-4 py-4">Guest</th>
                  <th className="px-4 py-4">Items</th>
                  <th className="px-4 py-4">Total</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="py-4 pl-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#101f3f]/5">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr className="group transition-colors hover:bg-[#101f3f]/[0.02]" key={order.id}>
                      <td className="py-4 pr-4 font-black text-[#101f3f]">{order.order_number}</td>
                      <td className="px-4 py-4 font-semibold text-[var(--muted)]">{order.customer_name || "Walk-in"}</td>
                      <td className="px-4 py-4 font-semibold text-[var(--muted)]">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-4 font-extrabold text-[#101f3f]">{formatMoney(Number(order.total_amount ?? 0), data.activeHotel?.currency)}</td>
                      <td className="px-4 py-4">
                        <Badge className="bg-white shadow-sm border border-[#101f3f]/10 text-[#101f3f] font-bold">{formatOrderStatus(order.status ?? "draft")}</Badge>
                      </td>
                      <td className="py-4 pl-4 text-right font-semibold text-[var(--muted)]">{formatTime(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-8 text-center text-sm font-semibold text-[var(--muted)]" colSpan={6}>
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="glass-panel animate-fade-in-up delay-500 rounded-[2rem] p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold text-[#101f3f]">Popular meals</h2>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0e7] text-[var(--accent)]">
                <CookingPot aria-hidden size={20} />
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {data.popularMeals.length > 0 ? (
                data.popularMeals.map((meal, index) => (
                  <div className="group flex items-center justify-between rounded-2xl border border-[#101f3f]/5 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md" key={meal.id}>
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101f3f]/[0.03] font-extrabold text-[#101f3f]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-black text-[#101f3f]">{meal.name}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{meal.quantity} ordered today</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm font-semibold text-[var(--muted)]">No meal ranking yet.</p>
              )}
            </div>
          </Card>

          <Card className="glass-panel animate-fade-in-up delay-500 rounded-[2rem] p-8 overflow-hidden relative">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--accent)] opacity-5 blur-[30px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-extrabold text-[#101f3f]">Active staff</h2>
                <Users aria-hidden className="text-[var(--accent)]" size={20} />
              </div>
              <p className="mt-6 text-6xl font-black tracking-tighter text-[#101f3f]">{data.stats.activeStaff}</p>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)] leading-relaxed">
                {formatRole(data.activeMembership?.role ?? "Staff")} access at {data.activeHotel?.name ?? "active hotel"}.
              </p>
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
    <Card className={cn("glass-panel group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,31,63,0.08)]", className)}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[var(--accent)] opacity-5 blur-[40px] transition-opacity duration-500 group-hover:opacity-10" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-[15px] font-extrabold tracking-tight text-[var(--muted)]">{label}</p>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff0e7] to-white text-[var(--accent)] shadow-[inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
            <Icon aria-hidden size={20} />
          </span>
        </div>
        <p className="mt-8 text-5xl font-black tracking-tighter text-[#101f3f]">{value}</p>
        <p className="mt-3 text-xs font-extrabold tracking-wide text-[var(--accent)] uppercase">{sublabel}</p>
      </div>
    </Card>
  );
}

function StatusDonut({ total }: { total: number }) {
  return (
    <div className="mt-12 flex flex-col items-center">
      <div
        className="group relative grid h-56 w-56 place-items-center rounded-full shadow-[0_20px_40px_rgba(16,31,63,0.08)] transition-transform duration-500 hover:scale-105"
        style={{
          background:
            "conic-gradient(#101f3f 0 55%, #ff6208 55% 76%, #9baac3 76% 90%, #e6edf8 90% 100%)"
        }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-white/20" />
        <div className="grid h-40 w-40 place-items-center rounded-full bg-white text-center shadow-[inset_0_4px_10px_rgba(16,31,63,0.1)]">
          <div>
            <p className="text-4xl font-black tracking-tighter text-[#101f3f]">{total}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mt-1">orders</p>
          </div>
        </div>
      </div>
      <div className="mt-10 grid w-full grid-cols-2 gap-4 text-xs font-extrabold text-[#101f3f]/70">
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
    <span className="flex items-center gap-3 transition-transform hover:translate-x-1">
      <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function AlertMessage({ children, tone }: { children: React.ReactNode; tone: "danger" | "warning" }) {
  return (
    <div
      className={cn(
        "animate-fade-in-up rounded-2xl border px-6 py-4 text-[15px] font-bold shadow-sm",
        tone === "danger"
          ? "border-red-500/20 bg-red-50 text-red-700"
          : "border-[var(--accent)]/20 bg-[#fff0e7] text-[var(--accent)]"
      )}
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-48 animate-pulse rounded-[2rem] bg-white/50" key={index} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/50" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-white/50" />
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