"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, MapPin, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listHotels } from "@/features/hotels/api";
import {
  getHotelDescription,
  getHotelImageUrl,
  getHotelInitials,
  getHotelLocation
} from "@/features/client/hotels/hotel-display";

export function ClientHotelsPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadHotels(searchTerm = submittedSearch) {
    setError(null);
    setLoading(true);

    try {
      if (!getAccessToken()) {
        setHotels([]);
        setError(
          "The backend currently requires sign-in before it returns hotels. Please sign in to browse hotels until a public hotels endpoint is enabled."
        );
        return;
      }

      const response = await listHotels({
        page_size: 100,
        search: searchTerm
      });
      setHotels(response.results.filter((hotel) => hotel.is_active !== false));
    } catch (hotelsError) {
      setError(getApiErrorMessage(hotelsError));
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHotels("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHotels = useMemo(() => {
    const normalizedSearch = submittedSearch.trim().toLowerCase();
    if (!normalizedSearch) return hotels;

    return hotels.filter((hotel) =>
      [hotel.name, hotel.address, hotel.code, hotel.timezone]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [hotels, submittedSearch]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = search.trim();
    setSubmittedSearch(nextSearch);
    await loadHotels(nextSearch);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <Badge>Guest ordering</Badge>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">Browse hotels</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Find the hotel you are ordering from, open its guest menu, and start a food order.
          </p>
        </div>

        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
          <Input
            disabled={loading}
            label="Search hotels"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hotel name, location, code..."
            value={search}
          />
          <Button className="self-end" disabled={loading} type="submit" variant="secondary">
            <Search aria-hidden size={18} />
            Search
          </Button>
        </form>
      </section>

      {error ? (
        <div className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]">
          <p>{error}</p>
          {error.includes("requires sign-in") ? (
            <Link
              className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
              href="/login?next=%2Fclient%2Fhotels"
            >
              Sign in to browse hotels
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Available hotels</h2>
          <Badge>{filteredHotels.length}</Badge>
        </div>
        <Button disabled={loading} onClick={() => loadHotels()} type="button" variant="secondary">
          <RefreshCw aria-hidden size={18} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-80 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
              key={index}
            />
          ))}
        </div>
      ) : filteredHotels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.id} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-[var(--muted)]">No hotels matched your search.</p>
        </Card>
      )}
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const imageUrl = getHotelImageUrl(hotel);

  return (
    <Card className="overflow-hidden p-0">
      {imageUrl ? (
        <div
          aria-label={hotel.name}
          className="h-44 bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${imageUrl}")` }}
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-[var(--surface-2)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-md bg-[var(--accent)] text-2xl font-bold text-[var(--accent-foreground)]">
            {getHotelInitials(hotel.name) || "H"}
          </div>
        </div>
      )}

      <div className="space-y-4 p-5">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-[var(--foreground)]">{hotel.name}</h3>
            {hotel.is_active ? <Badge>Open</Badge> : null}
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin aria-hidden size={16} />
            {getHotelLocation(hotel)}
          </p>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[var(--muted)]">{getHotelDescription(hotel)}</p>

        <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2">
          <span>Currency: {hotel.currency || "Not set"}</span>
          <span>Timezone: {hotel.timezone || "Not set"}</span>
        </div>

        <Link
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
          href={`/client/hotels/${hotel.id}`}
          onClick={() => saveActiveHotelId(hotel.id)}
        >
          View Hotel
          <ArrowRight aria-hidden size={18} />
        </Link>
      </div>
    </Card>
  );
}
