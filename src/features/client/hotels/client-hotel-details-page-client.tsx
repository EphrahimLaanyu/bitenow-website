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
    return <div className="h-96 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" />;
  }

  if (error || !hotel) {
    return (
      <Card>
        <p className="text-sm text-red-100">{error ?? "Hotel could not be loaded."}</p>
        {error?.includes("requires sign-in") ? (
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
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
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]" href="/client/hotels">
        <ArrowLeft aria-hidden size={16} />
        Back to hotels
      </Link>

      <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/82">
        {imageUrl ? (
          <div
            aria-label={hotel.name}
            className="h-72 bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div className="flex h-72 items-center justify-center bg-[var(--surface-2)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-md bg-[var(--accent)] text-3xl font-bold text-[var(--accent-foreground)]">
              {getHotelInitials(hotel.name) || "H"}
            </div>
          </div>
        )}

        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge>{hotel.is_active ? "Open for orders" : "Inactive"}</Badge>
            <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">{hotel.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {getHotelDescription(hotel)}
            </p>
          </div>

          <Card className="bg-[var(--surface)]">
            <div className="space-y-3 text-sm text-[var(--muted)]">
              <p className="flex items-center gap-2">
                <MapPin aria-hidden className="text-[var(--accent)]" size={16} />
                {getHotelLocation(hotel)}
              </p>
              <p className="flex items-center gap-2">
                <Phone aria-hidden className="text-[var(--accent)]" size={16} />
                {hotel.phone || "Phone not listed"}
              </p>
              <p className="flex items-center gap-2">
                <Mail aria-hidden className="text-[var(--accent)]" size={16} />
                {hotel.email || "Email not listed"}
              </p>
              <p className="flex items-center gap-2">
                <Building2 aria-hidden className="text-[var(--accent)]" size={16} />
                {hotel.currency || "Currency not set"} - {hotel.timezone || "Timezone not set"}
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Utensils aria-hidden className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Restaurant information</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{getHotelRestaurantInfo(hotel)}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Clock aria-hidden className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Opening hours</h2>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[var(--muted)]">
            {getHotelOpeningHours(hotel)}
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Images aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Hotel gallery</h2>
          <Badge>{gallery.length}</Badge>
        </div>
        {gallery.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {gallery.slice(0, 6).map((url) => (
              <div
                aria-label={hotel.name}
                className="h-40 rounded-md border border-[var(--border)] bg-[var(--surface-2)] bg-cover bg-center"
                key={url}
                role="img"
                style={{ backgroundImage: `url("${url}")` }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">No gallery images are available from the API yet.</p>
          </Card>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
          href={`/client/hotels/${hotel.id}/menu`}
        >
          Browse Menu
          <ArrowRight aria-hidden size={18} />
        </Link>
        <Button onClick={() => saveActiveHotelId(hotel.id)} type="button" variant="secondary">
          Use this hotel
        </Button>
      </div>
    </div>
  );
}
