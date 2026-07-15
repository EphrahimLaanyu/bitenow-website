"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  CookingPot,
  ShieldCheck,
  Table2,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import type { Hotel, HotelMembership, MenuItem, Order, Payment, DiningTable } from "@/lib/api/types";
import { getHotel, listHotels } from "@/features/hotels/api";
import { listMenuItems } from "@/features/menu/api";
import { listOrders } from "@/features/orders/api";
import { listPayments } from "@/features/payments/api";
import { listStaffMemberships } from "@/features/staff/api";
import { listTables } from "@/features/tables/api";

type DashboardState = {
  activeHotel: Hotel | null;
  activeMembership: HotelMembership | null;
  hotels: Hotel[];
  memberships: HotelMembership[];
  popularMeals: PopularMeal[];
  statErrors: string[];
  stats: {
    activeStaff: number;
    occupiedTables: number;
    pendingOrders: number;
    revenue: number;
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
  popularMeals: [],
  statErrors: [],
  stats: {
    activeStaff: 0,
    occupiedTables: 0,
    pendingOrders: 0,
    revenue: 0,
    todayOrders: 0
  }
};

export function DashboardPageClient() {
  const { status, user } = useAuth();
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
          popularMeals: getPopularMeals(operationsLoad.orders, operationsLoad.menuItems),
          statErrors: [
            ...(hotelsLoad.error ? [`Hotels: ${hotelsLoad.error}`] : []),
            ...operationsLoad.errors
          ],
          stats: buildStats(
            operationsLoad.orders,
            operationsLoad.payments,
            operationsLoad.tables,
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

  const userLabel = useMemo(() => {
    if (!user) return "Authenticated user";
    return (
      user.name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email ||
      user.username ||
      "Authenticated user"
    );
  }, [user]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Operations
              </p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
                {data.activeHotel?.name ?? "Dashboard"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Signed in as {userLabel}. This is the active hotel context used by orders, menu,
                tables, and payments.
              </p>
            </div>
            <Badge>{formatRole(data.activeMembership?.role ?? "staff")}</Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HotelMeta label="Code" value={data.activeHotel?.code} />
            <HotelMeta label="Currency" value={data.activeHotel?.currency} />
            <HotelMeta label="Timezone" value={data.activeHotel?.timezone} />
            <HotelMeta label="Status" value={data.activeHotel?.is_active ? "Active" : "Inactive"} />
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-[var(--foreground)]">Hotel access</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {data.memberships.length} membership{data.memberships.length === 1 ? "" : "s"} available
            for this account.
          </p>
          <div className="mt-4 space-y-2">
            {data.hotels.slice(0, 3).map((hotel) => (
              <div
                className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                key={hotel.id}
              >
                <span className="truncate text-sm text-[var(--foreground)]">{hotel.name}</span>
                <span className="text-xs text-[var(--muted)]">{hotel.code}</span>
              </div>
            ))}
            {data.hotels.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No hotels returned by the API yet.</p>
            ) : null}
          </div>
        </Card>
      </section>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {data.statErrors.length > 0 ? (
        <div className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          Some operational counts could not be loaded: {data.statErrors.join(" ")}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Today's Orders" value={data.stats.todayOrders} />
        <StatCard
          icon={Banknote}
          label="Revenue"
          value={formatMoney(data.stats.revenue, data.activeHotel?.currency)}
        />
        <StatCard icon={Table2} label="Occupied Tables" value={data.stats.occupiedTables} />
        <StatCard icon={ClipboardList} label="Pending Orders" value={data.stats.pendingOrders} />
        <StatCard icon={CookingPot} label="Popular Meals" value={data.popularMeals[0]?.name ?? "No data"} />
        <StatCard icon={AlertTriangle} label="Low Stock" value="Not supported" />
        <StatCard icon={Users} label="Active Staff" value={data.stats.activeStaff} />
        <StatCard icon={ShieldCheck} label="Role" value={formatRole(data.activeMembership?.role ?? "Staff")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Popular Meals</h2>
            <CookingPot aria-hidden className="text-[var(--accent)]" size={20} />
          </div>
          <div className="mt-4 space-y-3">
            {data.popularMeals.length > 0 ? (
              data.popularMeals.map((meal, index) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                  key={meal.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {index + 1}. {meal.name}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{meal.quantity} ordered today</p>
                  </div>
                  <Badge>{meal.quantity}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No completed order-item data for today yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Low Stock</h2>
            <AlertTriangle aria-hidden className="text-[var(--accent)]" size={20} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            The uploaded API spec does not expose inventory or stock endpoints yet. Once stock or
            ingredients are added to the backend, this card can show low-stock ingredients and menu
            items that need restocking.
          </p>
        </Card>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function HotelMeta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-[var(--foreground)]">{value || "Not set"}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <Icon aria-hidden className="text-[var(--accent)]" size={18} />
      </div>
      <p className="mt-3 truncate text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{value}</p>
    </Card>
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
  memberships: HotelMembership[]
) {
  const todayOrders = orders.filter((order) => isToday(order.created_at));
  const paidToday = payments.filter(
    (payment) => payment.status === "paid" && isToday(payment.paid_at ?? payment.created_at)
  );

  return {
    activeStaff: memberships.filter((membership) => membership.is_active !== false).length,
    occupiedTables: tables.filter((table) => table.status === "occupied").length,
    pendingOrders: orders.filter((order) =>
      ["draft", "placed", "accepted", "in_preparation", "ready"].includes(order.status ?? "draft")
    ).length,
    revenue: paidToday.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
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
