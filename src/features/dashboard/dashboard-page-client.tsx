"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Hotel as HotelIcon, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import type { Hotel, HotelMembership } from "@/lib/api/types";
import { getHotel, listHotels } from "@/features/hotels/api";
import { listStaffMemberships } from "@/features/staff/api";

type DashboardState = {
  activeHotel: Hotel | null;
  activeMembership: HotelMembership | null;
  hotels: Hotel[];
  memberships: HotelMembership[];
  statErrors: string[];
  stats: {
    activeHotels: number;
    hotels: number;
    memberships: number;
  };
};

const emptyState: DashboardState = {
  activeHotel: null,
  activeMembership: null,
  hotels: [],
  memberships: [],
  statErrors: [],
  stats: {
    activeHotels: 0,
    hotels: 0,
    memberships: 0
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
        const activeMembership =
          memberships.find((membership) => membership.is_active !== false) ?? memberships[0] ?? null;

        const hotelsLoad = await loadHotels(activeMembership);

        if (cancelled) return;

        const hotels = hotelsLoad.hotels;
        const activeHotel =
          hotels.find((hotel) => hotel.id === activeMembership?.hotel) ?? hotels[0] ?? null;

        setData({
          activeHotel,
          activeMembership,
          hotels,
          memberships,
          statErrors: hotelsLoad.error ? [`Hotels: ${hotelsLoad.error}`] : [],
          stats: {
            activeHotels: hotels.filter((hotel) => hotel.is_active).length,
            hotels: hotels.length,
            memberships: memberships.length
          }
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f97316]">
                Operations
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                {data.activeHotel?.name ?? "Dashboard"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#91a4bc]">
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
          <p className="text-sm font-semibold text-white">Hotel access</p>
          <p className="mt-2 text-sm text-[#91a4bc]">
            {data.memberships.length} membership{data.memberships.length === 1 ? "" : "s"} available
            for this account.
          </p>
          <div className="mt-4 space-y-2">
            {data.hotels.slice(0, 3).map((hotel) => (
              <div
                className="flex items-center justify-between rounded-md border border-[#1e3350] bg-[#07111f] px-3 py-2"
                key={hotel.id}
              >
                <span className="truncate text-sm text-white">{hotel.name}</span>
                <span className="text-xs text-[#91a4bc]">{hotel.code}</span>
              </div>
            ))}
            {data.hotels.length === 0 ? (
              <p className="text-sm text-[#91a4bc]">No hotels returned by the API yet.</p>
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
        <div className="rounded-md border border-[#f97316]/30 bg-[#f97316]/10 px-4 py-3 text-sm text-[#fdba74]">
          Some operational counts could not be loaded: {data.statErrors.join(" ")}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Building2} label="Hotels loaded" value={data.stats.hotels} />
        <StatCard icon={HotelIcon} label="Active hotels" value={data.stats.activeHotels} />
        <StatCard icon={Users} label="Memberships" value={data.stats.memberships} />
        <StatCard icon={ShieldCheck} label="Role" value={formatRole(data.activeMembership?.role ?? "Staff")} />
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-lg border border-[#1e3350] bg-[#0b1f3a]/70" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-lg border border-[#1e3350] bg-[#0b1f3a]/70"
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function HotelMeta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border border-[#1e3350] bg-[#07111f] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[#60758f]">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white">{value || "Not set"}</p>
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
        <p className="text-sm text-[#91a4bc]">{label}</p>
        <Icon aria-hidden className="text-[#f97316]" size={18} />
      </div>
      <p className="mt-3 truncate text-2xl font-bold text-white sm:text-3xl">{value}</p>
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

function formatRole(role: string) {
  return role.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}
