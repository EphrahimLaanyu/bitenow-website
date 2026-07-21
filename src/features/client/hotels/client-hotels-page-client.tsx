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
    <div className="space-y-10 selection:bg-[#f97316] selection:text-white">
      {/* HEADER SECTION */}
{/* HEADER SECTION */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[#101f3f]/5 bg-white px-8 py-12 shadow-[0_20px_40px_rgb(0,0,0,0.03)] lg:px-12 lg:py-16">
        {/* Subtle ambient background glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#f97316]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[#101f3f]/5 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f97316]/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#f97316]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f97316]"></span>
              Guest ordering
            </span>
            <h1 className="font-display mt-6 text-5xl font-extrabold tracking-tight text-[#101f3f] md:text-6xl">
              Browse hotels
            </h1>
            <p className="mt-5 max-w-xl text-[17px] font-medium leading-relaxed text-[#101f3f]/60">
              Find the hotel you are ordering from, open its guest menu, and start a food order in seconds.
            </p>
          </div>

          <form className="w-full shrink-0 lg:w-[420px]" onSubmit={handleSearch}>
            {/* Unified Search Pill */}
            <div className="relative flex items-center rounded-full border border-[#101f3f]/10 bg-[#fafbfc] p-1.5 shadow-sm transition-all focus-within:border-[#f97316]/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#f97316]/10 hover:border-[#101f3f]/20">
              <Search aria-hidden size={20} className="ml-4 shrink-0 text-[#101f3f]/40" />
              <Input
                className="h-12 w-full border-none bg-transparent px-4 text-[15px] font-bold text-[#101f3f] placeholder:font-medium placeholder:text-[#101f3f]/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={loading}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, location..."
                value={search}
              />
              <Button
                className="h-12 shrink-0 rounded-full bg-[#101f3f] px-8 text-[14px] font-bold text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] transition-all duration-300 hover:scale-105 hover:bg-[#f97316] hover:shadow-[0_6px_20px_rgba(249,115,22,0.25)] active:scale-95"
                disabled={loading}
                type="submit"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ERROR STATE */}
      {error ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-[#f97316]/20 bg-gradient-to-r from-[#f97316]/5 to-transparent p-6 shadow-sm">
          {/* Bold left accent line */}
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#f97316]" />
          
          <div className="flex w-full flex-col justify-between gap-5 pl-2 sm:flex-row sm:items-center">
            <p className="max-w-3xl text-[14px] font-bold leading-relaxed text-[#101f3f]">
              <span className="mr-2 text-[#f97316]">Notice:</span>
              {error}
            </p>
            {error.includes("requires sign-in") ? (
              <Link
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#101f3f] px-6 text-[13px] font-bold tracking-wide text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] transition-all duration-300 hover:scale-105 hover:bg-[#f97316] hover:shadow-[0_6px_20px_rgba(249,115,22,0.25)]"
                href="/login?next=%2Fclient%2Fhotels"
              >
                Sign in to browse
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#101f3f]/5 pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#101f3f]/[0.03] text-[#101f3f]">
            <Building2 aria-hidden size={22} strokeWidth={1.5} />
          </span>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#101f3f]">Available hotels</h2>
          <span className="ml-2 flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#101f3f] px-2.5 text-[12px] font-extrabold text-white shadow-sm">
            {filteredHotels.length}
          </span>
        </div>
        <Button
          className="h-11 rounded-full border border-[#101f3f]/10 bg-white px-5 text-[13px] font-bold text-[#101f3f]/70 shadow-sm transition-all hover:border-[#101f3f]/20 hover:text-[#101f3f] hover:bg-[#fafbfc]"
          disabled={loading}
          onClick={() => loadHotels()}
          type="button"
          variant="outline"
        >
          <RefreshCw aria-hidden size={16} className={cn("mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="h-[420px] animate-pulse rounded-[2rem] border border-[#101f3f]/5 bg-white shadow-sm"
              key={index}
            >
              <div className="h-52 w-full rounded-t-[2rem] bg-[#101f3f]/5" />
              <div className="p-6 space-y-4">
                <div className="h-6 w-2/3 rounded-full bg-[#101f3f]/10" />
                <div className="h-4 w-1/3 rounded-full bg-[#101f3f]/5" />
                <div className="mt-6 h-12 w-full rounded-full bg-[#101f3f]/5" />
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
        <Card className="flex flex-col items-center justify-center rounded-[2.5rem] border-dashed border-[#101f3f]/10 bg-[#fafbfc] py-20 text-center shadow-none">
          <Search size={40} className="mb-4 text-[#101f3f]/20" />
          <p className="font-display text-xl font-extrabold text-[#101f3f]">No hotels found</p>
          <p className="mt-2 text-[14px] font-medium text-[#101f3f]/50">Try adjusting your search terms.</p>
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
    <Card className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#101f3f]/5 bg-white p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
      {/* IMAGE / HEADER AREA */}
      <div className="relative h-52 w-full overflow-hidden bg-[#101f3f]">
        {imageUrl ? (
          <>
            <div
              aria-label={hotel.name}
              className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              role="img"
              style={{ backgroundImage: `url("${imageUrl}")` }}
            />
            {/* Subtle overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101f3f]/60 via-transparent to-[#101f3f]/20 mix-blend-multiply" />
          </>
        ) : (
          <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-[#101f3f] to-[#182d58] transition-transform duration-700 group-hover:scale-105">
            <div className="font-display text-5xl font-extrabold text-white/30">
              {getHotelInitials(hotel.name) || "H"}
            </div>
          </div>
        )}
        
        {/* STATUS BADGE */}
        {hotel.is_active && (
          <div className="absolute right-4 top-4">
            <Badge className="border-none bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#f97316] shadow-lg backdrop-blur-md">
              Open
            </Badge>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex flex-1 flex-col p-6">
        <div>
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#101f3f]">{hotel.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-bold text-[#101f3f]/50">
            <MapPin aria-hidden size={14} className="text-[#f97316]" />
            {getHotelLocation(hotel)}
          </p>
        </div>

        <p className="mt-4 line-clamp-2 text-[14px] font-medium leading-relaxed text-[#101f3f]/60">
          {getHotelDescription(hotel)}
        </p>

        {/* META TAGS */}
        <div className="mt-5 mb-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-lg bg-[#fafbfc] border border-[#101f3f]/5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#101f3f]/50">
            {hotel.currency || "No Currency"}
          </span>
          <span className="inline-flex items-center rounded-lg bg-[#fafbfc] border border-[#101f3f]/5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#101f3f]/50">
            {hotel.timezone || "No Timezone"}
          </span>
        </div>

        {/* CTA BUTTON */}
        <div className="mt-auto pt-2">
          <Link
            className="group/btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#fafbfc] text-[14px] font-bold text-[#101f3f] transition-all duration-300 hover:bg-[#f97316] hover:text-white hover:shadow-[0_8px_25px_rgba(249,115,22,0.35)]"
            href={`/client/hotels/${hotel.id}`}
            onClick={() => saveActiveHotelId(hotel.id)}
          >
            View Hotel
            <ArrowRight aria-hidden size={18} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </Card>
  );
}