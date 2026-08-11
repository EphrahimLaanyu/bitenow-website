"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ChefHat,
  Clock3,
  CreditCard,
  LogIn,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Sparkles,
  Utensils
} from "lucide-react";
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

export function ClientHomePageClient() {
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

  const needsSignIn = error?.includes("requires sign-in");

  return (
    <div className="space-y-12 pb-24 md:pb-20">
      {/* HERO SECTION */}
      <section className="hero-surface food-spotlight relative isolate overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white px-5 pb-16 pt-10 shadow-sm md:px-8 md:pb-24 md:pt-16">
        {/* Subtle background glow */}
        <div className="hero-glow absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#f97316]/10 to-transparent blur-3xl" />
        <div aria-hidden className="hero-dots absolute inset-0 -z-10 opacity-50" />
        
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="relative z-10">
            <p className="animate-fade-in-up text-[11px] font-bold uppercase tracking-[0.3em] text-[#f97316]">
              Order fast. Eat now.
            </p>
            <h1 className="animate-fade-in-up delay-100 mt-6 max-w-4xl text-[2.75rem] font-extrabold tracking-[-0.045em] text-[#101f3f] leading-[0.98] sm:text-6xl lg:text-7xl">
              Food ordering for hotels that feels <span className="text-[#f97316]">instant.</span>
            </h1>
            <p className="animate-fade-in-up delay-200 mt-8 max-w-xl text-[15px] leading-relaxed text-[#101f3f]/60 sm:text-[17px]">
              BiteNow gives guests a beautiful way to discover hotels, browse menus, place orders,
              and track every step while teams manage service from a focused dashboard.
            </p>
            <div className="animate-fade-in-up delay-300 mt-10 flex flex-wrap items-center gap-4">
              <Button
                className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-[#f97316] px-8 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(249,115,22,0.25)] transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ea6505] hover:shadow-[0_15px_40px_rgba(249,115,22,0.35)]"
                onClick={() => {
                  document.getElementById("hotels-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Start ordering
                <ArrowRight aria-hidden size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <p className="flex items-center gap-2 text-xs font-semibold text-[#101f3f]/55"><Sparkles aria-hidden size={15} className="text-[#f97316]" /> Secure checkout. Live updates.</p>
            </div>

          </div>

          {/* HERO APP UI MOCKUP */}
          <div className="shimmer-border animate-scale-in delay-200 relative rounded-[2.5rem] border border-[#101f3f]/5 bg-white p-2.5 shadow-[0_30px_80px_rgba(16,31,63,0.08)] transition-transform duration-700 hover:-translate-y-2">
            <div className="overflow-hidden rounded-[2rem] border border-[#101f3f]/5 bg-[#fafbfc]">
              <div className="relative h-40 bg-[#101f3f] p-6 text-white overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1542314831-c6a4d14db8cb?auto=format&fit=crop&q=80&w=800" 
                  alt="The Grand Meridian" 
                  className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
                />
                <div className="relative z-10 flex items-start justify-between h-full flex-col">
                  <div className="flex w-full items-center justify-between">
                    <Badge className="bg-[#f97316] text-white hover:bg-[#ea6505] px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none shadow-md">Open</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Featured hotel</p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight">The Grand Meridian</h2>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 p-6">
                <HeroMeal title="Spiced chicken bowl" price="KES 1,250" icon={ChefHat} />
                <HeroMeal title="Citrus breakfast plate" price="KES 980" icon={Utensils} />
                <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
                  <MiniMetric icon={Clock3} label="Avg prep" value="18 min" />
                  <MiniMetric icon={CreditCard} label="Checkout" value="Secure" />
                  <MiniMetric icon={Star} label="Rating" value="4.9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOTELS BROWSE SECTION */}
      <div id="hotels-section" className="space-y-6 md:space-y-8 scroll-mt-24">
        <section className="glass-panel theme-section flex flex-col gap-6 rounded-[1.5rem] p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
              <span className="mr-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-[var(--accent)]"></span>
              Guest ordering
            </Badge>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Browse hotels
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Find the hotel you are ordering from, open its guest menu, and start a food order in seconds.
            </p>
          </div>

          <form className="w-full shrink-0 lg:w-[380px]" onSubmit={handleSearch}>
            <div className="relative flex items-center">
              <Search aria-hidden size={18} className="absolute left-3 text-slate-400" />
              <Input
                className="h-12 w-full rounded-xl border-slate-200 pl-10 pr-24 text-sm placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)] shadow-sm transition-all"
                disabled={loading}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, location..."
                value={search}
              />
              <Button
                className="absolute right-1 h-10 rounded-lg px-4 text-xs font-bold shadow-[0_5px_14px_rgba(249,115,22,0.22)]"
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
          <div className={cn("flex flex-col gap-4 rounded-[1.5rem] border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between", needsSignIn ? "border-[#f97316]/20 bg-[#fff7f2]" : "border-amber-200 bg-amber-50")}>
            <div className="flex items-start gap-3"><div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", needsSignIn ? "bg-[#f97316] text-white shadow-[0_8px_20px_rgba(249,115,22,0.25)]" : "bg-amber-100 text-amber-800")}>{needsSignIn ? <LogIn aria-hidden size={19} /> : <Search aria-hidden size={19} />}</div><div><p className={cn("font-bold", needsSignIn ? "text-[#101f3f]" : "text-amber-900")}>{needsSignIn ? "Sign in to see hotels available to your stay" : "We couldn’t load hotels"}</p><p className={cn("mt-1 text-sm leading-relaxed", needsSignIn ? "text-[#101f3f]/60" : "text-amber-800")}>{needsSignIn ? "Your saved hotels, menus, and live availability will appear here after you sign in." : error}</p></div></div>
            {needsSignIn ? (
              <Link
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f97316] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#ea6505]"
                href="/login?next=%2F"
              >
                Sign in to browse
                <ArrowRight aria-hidden size={16} />
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
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Available hotels</h3>
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
          <Card className="flex flex-col items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101f3f]/[0.04] text-[#f97316]">
              <Search size={24} />
            </div>
            <p className="text-lg font-semibold text-slate-900">No hotels found</p>
            <p className="mt-1 text-sm text-slate-500">Try a hotel name, city, or a nearby landmark.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function HotelCard({ hotel }: { hotel: Hotel }) {
  const imageUrl = getHotelImageUrl(hotel);

  return (
    <Card className="group/card flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#f97316]/20 hover:shadow-[0_18px_46px_rgba(16,31,63,0.12)]">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        {imageUrl ? (
          <div
            aria-label={hotel.name}
            className="absolute inset-0 h-full w-full bg-cover bg-center transition-transform duration-700 group-hover/card:scale-105"
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
        
        {hotel.is_active && (
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-white/95 text-slate-700 shadow-sm backdrop-blur-md border border-slate-200 font-medium">
              Open
            </Badge>
          </div>
        )}
      </div>

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

        <div className="mt-4 mb-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {hotel.currency || "No Currency"}
          </span>
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {hotel.timezone || "No Timezone"}
          </span>
        </div>

        <div className="mt-auto pt-1">
          <Link
            className="group/btn inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-all hover:border-[#f97316]/30 hover:bg-[#fff7f2] hover:text-[#e95705] shadow-sm"
            href={`/client/menu`}
            onClick={() => saveActiveHotelId(hotel.id)}
          >
            View Hotel Menu
            <ArrowRight aria-hidden size={16} className="text-slate-400 group-hover/btn:text-slate-600 transition-colors" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function HeroMeal({
  icon: Icon,
  price,
  title
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean; strokeWidth?: number }>;
  price: string;
  title: string;
}) {
  const imageMap: Record<string, string> = {
    "Spiced chicken bowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
    "Citrus breakfast plate": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=200"
  };

  const imageUrl = imageMap[title];

  return (
    <div className="group flex cursor-default items-center justify-between gap-4 rounded-[1.5rem] border border-[#101f3f]/5 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f97316]/15 hover:shadow-md">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-14 w-14 rounded-[1rem] object-cover shadow-sm transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#101f3f]/[0.03] text-[#101f3f]">
            <Icon aria-hidden size={22} />
          </span>
        )}
        <div>
          <p className="font-bold text-[15px] tracking-tight text-[#101f3f]">{title}</p>
          <p className="text-[12px] font-semibold text-[#f97316]">Ready to order</p>
        </div>
      </div>
      <p className="pr-2 font-extrabold text-[#101f3f]">{price}</p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#101f3f]/5 bg-white p-4 shadow-sm transition-colors hover:bg-[#fafbfc]">
      <Icon aria-hidden className="text-[#f97316] mb-2" size={20} strokeWidth={2} />
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#101f3f]/40">{label}</p>
      <p className="mt-0.5 text-[14px] font-extrabold text-[#101f3f]">{value}</p>
    </div>
  );
}
