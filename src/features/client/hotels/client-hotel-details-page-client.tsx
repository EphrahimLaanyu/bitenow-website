"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Clock, Images, Mail, MapPin, Phone, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-storage";
import { saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { getHotel } from "@/features/hotels/api";
import {
  getHotelDescription,
  getHotelGallery,
  getHotelImageUrl,
  getHotelInitials,
  getHotelLocation,
  getHotelOpeningHours,
  getHotelRestaurantInfo
} from "@/features/client/hotels/hotel-display";

export function ClientHotelDetailsPageClient({ hotelId }: { hotelId: string }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHotel() {
      setError(null);
      setLoading(true);

      try {
        if (!getAccessToken()) {
          throw new Error(
            "The backend currently requires sign-in before it returns hotel details. Please sign in to view this hotel until a public hotel endpoint is enabled."
          );
        }

        const loadedHotel = await getHotel(hotelId);
        if (cancelled) return;
        setHotel(loadedHotel);
        saveActiveHotelId(loadedHotel.id);
      } catch (hotelError) {
        if (!cancelled) setError(getApiErrorMessage(hotelError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHotel();

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm" />;
  }

  if (error || !hotel) {
    return (
      <Card className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-800">{error ?? "Hotel could not be loaded."}</p>
        {error?.includes("requires sign-in") ? (
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
            href={`/login?next=${encodeURIComponent(`/client/hotels/${hotelId}`)}`}
          >
            Sign in to view hotel
          </Link>
        ) : null}
      </Card>
    );
  }

  const imageUrl = getHotelImageUrl(hotel);
  const gallery = getHotelGallery(hotel);

  return (
    <div className="space-y-6 md:space-y-8">
      <Link 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900" 
        href="/client/hotels"
      >
        <ArrowLeft aria-hidden size={16} />
        Back to hotels
      </Link>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {imageUrl ? (
          <div
            aria-label={hotel.name}
            className="h-64 bg-cover bg-center md:h-80"
            role="img"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-slate-50 text-slate-300 border-b border-slate-100 md:h-80">
            <div className="text-6xl font-bold tracking-tight">
              {getHotelInitials(hotel.name) || "H"}
            </div>
          </div>
        )}

        <div className="grid gap-6 p-6 lg:gap-8 lg:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge 
              variant={hotel.is_active ? "secondary" : "outline"} 
              className={hotel.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-slate-500 bg-slate-50"}
            >
              {hotel.is_active ? "Open for orders" : "Inactive"}
            </Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
              {hotel.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              {getHotelDescription(hotel)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
            <div className="space-y-3.5 text-sm font-medium text-slate-600">
              <p className="flex items-center gap-3">
                <MapPin aria-hidden className="text-slate-400" size={18} />
                <span className="leading-tight">{getHotelLocation(hotel)}</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone aria-hidden className="text-slate-400" size={18} />
                {hotel.phone || "Phone not listed"}
              </p>
              <p className="flex items-center gap-3">
                <Mail aria-hidden className="text-slate-400" size={18} />
                {hotel.email || "Email not listed"}
              </p>
              <p className="flex items-center gap-3">
                <Building2 aria-hidden className="text-slate-400" size={18} />
                {hotel.currency || "Currency not set"} - {hotel.timezone || "Timezone not set"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
              <Utensils aria-hidden size={20} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Restaurant information</h2>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            {getHotelRestaurantInfo(hotel)}
          </p>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
              <Clock aria-hidden size={20} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Opening hours</h2>
          </div>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {getHotelOpeningHours(hotel)}
          </p>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500 border border-slate-100">
            <Images aria-hidden size={16} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Hotel gallery</h2>
          <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
            {gallery.length}
          </Badge>
        </div>
        
        {gallery.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.slice(0, 6).map((url) => (
              <div
                aria-label={hotel.name}
                className="h-48 rounded-xl border border-slate-200 bg-slate-100 bg-cover bg-center shadow-sm transition-transform hover:scale-[1.02]"
                key={url}
                role="img"
                style={{ backgroundImage: `url("${url}")` }}
              />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
            <Images className="mb-3 text-slate-300" size={32} />
            <p className="text-sm font-medium text-slate-500">No gallery images are available from the API yet.</p>
          </Card>
        )}
      </section>

      <div className="flex flex-wrap gap-4 pt-4 pb-12">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          href={`/client/hotels/${hotel.id}/menu`}
        >
          Browse Menu
          <ArrowRight aria-hidden size={18} />
        </Link>
        <Button 
          className="h-11 rounded-lg px-6 font-medium shadow-sm" 
          onClick={() => saveActiveHotelId(hotel.id)} 
          type="button" 
          variant="secondary"
        >
          Use this hotel
        </Button>
      </div>
    </div>
  );
}