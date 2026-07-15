"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Mail, Phone, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel } from "@/lib/api/types";
import { listHotels } from "@/features/hotels/api";

export function HotelsPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHotels() {
      setError(null);
      setLoading(true);

      try {
        const response = await listHotels({ page_size: 50, search: search || undefined });
        if (!cancelled) {
          setHotels(response.results);
          setCount(response.count);
        }
      } catch (hotelsError) {
        if (!cancelled) setError(getApiErrorMessage(hotelsError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHotels();

    return () => {
      cancelled = true;
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge>Hotels API</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Hotels</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Live hotel records from the backend. These hotels provide the operating context for
            tables, menu, orders, payments, and staff roles.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
          href="/hotels/new"
        >
          <Plus aria-hidden size={18} />
          New hotel
        </Link>
      </div>

      <Card className="max-w-xl">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            size={18}
          />
          <Input
            aria-label="Search hotels"
            className="pl-10"
            name="hotel-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search hotels..."
            value={search}
          />
        </div>
      </Card>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                className="h-52 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
                key={index}
              />
            ))
          : hotels.map((hotel) => <HotelCard hotel={hotel} key={hotel.id} />)}
      </div>

      {!loading && hotels.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">No hotels were returned by the API.</p>
        </Card>
      ) : null}

      {!loading && count > hotels.length ? (
        <p className="text-sm text-[var(--muted)]">
          Showing {hotels.length} of {count} hotels. Search and pagination can be added next.
        </p>
      ) : null}
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Building2 aria-hidden size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">{hotel.code}</span>
          </div>
          <h2 className="mt-3 truncate text-xl font-bold text-[var(--foreground)]">{hotel.name}</h2>
        </div>
        <Badge className={hotel.is_active ? undefined : "border-[var(--border)] bg-[var(--surface-3)] text-[var(--muted)]"}>
          {hotel.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm text-[var(--muted)]">
        <HotelLine label="Currency" value={hotel.currency} />
        <HotelLine label="Timezone" value={hotel.timezone} />
        <HotelLine label="Address" value={hotel.address} />
      </div>

      <div className="space-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
        <p className="flex items-center gap-2">
          <Mail aria-hidden className="text-[var(--accent)]" size={16} />
          <span className="truncate">{hotel.email || "No email set"}</span>
        </p>
        <p className="flex items-center gap-2">
          <Phone aria-hidden className="text-[var(--accent)]" size={16} />
          <span>{hotel.phone || "No phone set"}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
          href={`/hotels/${hotel.id}`}
        >
          View details
        </Link>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          href={`/hotels/${hotel.id}/edit`}
        >
          Edit
        </Link>
      </div>
    </Card>
  );
}

function HotelLine({ label, value }: { label: string; value?: string }) {
  return (
    <p className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="truncate text-right text-[var(--foreground)]">{value || "Not set"}</span>
    </p>
  );
}
