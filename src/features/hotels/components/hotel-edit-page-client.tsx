"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { HotelForm } from "@/features/hotels/components/hotel-form";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, UUID } from "@/lib/api/types";
import { getHotel } from "@/features/hotels/api";

export function HotelEditPageClient({ hotelId }: { hotelId: UUID }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHotel() {
      setError(null);
      setLoading(true);

      try {
        const response = await getHotel(hotelId);
        if (!cancelled) setHotel(response);
      } catch (editError) {
        if (!cancelled) setError(getApiErrorMessage(editError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHotel();

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" href={`/hotels/${hotelId}`}>
        <ArrowLeft aria-hidden size={16} />
        Hotel details
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Edit hotel</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Update the hotel profile and operational defaults.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="h-96 max-w-4xl animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70" />
      ) : hotel ? (
        <HotelForm hotel={hotel} mode="edit" />
      ) : null}
    </div>
  );
}
