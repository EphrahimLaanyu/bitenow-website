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
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <section className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between shadow-sm">
        <div className="max-w-2xl">
          <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
            <span className="mr-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-[var(--accent)]"></span>
            Guest ordering
          </Badge>
          <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Browse hotels
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Find the hotel you are ordering from, open its guest menu, and start a food order in seconds.
          </p>
        </div>

        <form className="w-full shrink-0 lg:w-[380px]" onSubmit={handleSearch}>
          <div className="relative flex items-center">
            <Search aria-hidden size={18} className="absolute left-3 text-slate-400" />
            <Input
              className="h-10 w-full rounded-lg border-slate-200 pl-10 pr-24 text-sm placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] shadow-sm transition-all"
              disabled={loading}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, location..."
              value={search}
            />
            <Button
              className="absolute right-1 h-8 rounded-md px-3 text-xs font-medium"
              disabled={loading}
              type="submit"
            >
              Search
            </Button>
          </div>
        </form>
      </section>

      {/* ERROR STATE */}
      {error ? (
        <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <p className="text-sm font-medium text-amber-800">
            <span className="font-bold">Notice: </span>
            {error}
          </p>
          {error.includes("requires sign-in") ? (
            <Link
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-700 shadow-sm"
              href="/login?next=%2Fclient%2Fhotels"
            >
              Sign in to browse
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            <Building2 aria-hidden size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Available hotels</h2>
          <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
            {filteredHotels.length}
          </Badge>
        </div>
        <Button
          className="h-9 rounded-lg font-medium shadow-sm"
          disabled={loading}
          onClick={() => loadHotels()}
          type="button"
          variant="secondary"
        >
          <RefreshCw aria-hidden size={16} className={cn("mr-2 text-slate-500", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-[340px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm overflow-hidden flex flex-col"
              key={index}
            >
              <div className="h-40 w-full bg-slate-200/50" />
              <div className="p-5 space-y-4 flex-1">
                <div className="h-5 w-2/3 rounded bg-slate-200/50" />
                <div className="h-4 w-1/3 rounded bg-slate-200/30" />
                <div className="mt-6 h-9 w-full rounded-lg bg-slate-200/50" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredHotels.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.id} />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <Search size={24} />
          </div>
          <p className="text-lg font-semibold text-slate-900">No hotels found</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search terms.</p>
        </Card>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function HotelCard({ hotel }: { hotel: Hotel }) {
  const imageUrl = getHotelImageUrl(hotel);

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm transition-shadow hover:shadow-md">
      {/* IMAGE / HEADER AREA */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        {imageUrl ? (
          <div
            aria-label={hotel.name}
            className="absolute inset-0 h-full w-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
            <div className="text-4xl font-bold tracking-tight">
              {getHotelInitials(hotel.name) || "H"}
            </div>
          </div>
        )}
        
        {/* STATUS BADGE */}
        {hotel.is_active && (
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-white/95 text-slate-700 shadow-sm backdrop-blur-md border border-slate-200 font-medium">
              Open
            </Badge>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{hotel.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin aria-hidden size={14} className="text-slate-400" />
            {getHotelLocation(hotel)}
          </p>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {getHotelDescription(hotel)}
        </p>

        {/* META TAGS */}
        <div className="mt-4 mb-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {hotel.currency || "No Currency"}
          </span>
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {hotel.timezone || "No Timezone"}
          </span>
        </div>

        {/* CTA BUTTON */}
        <div className="mt-auto pt-1">
          <Link
            className="group/btn inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
            href={`/client/hotels/${hotel.id}`}
            onClick={() => saveActiveHotelId(hotel.id)}
          >
            View Hotel
            <ArrowRight aria-hidden size={16} className="text-slate-400 group-hover/btn:text-slate-600 transition-colors" />
          </Link>
        </div>
      </div>
    </Card>
  );
}