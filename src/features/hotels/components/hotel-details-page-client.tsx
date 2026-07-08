"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, UUID } from "@/lib/api/types";
import { deleteHotel, getHotel } from "@/features/hotels/api";

export function HotelDetailsPageClient({ hotelId }: { hotelId: UUID }) {
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHotel() {
      setError(null);
      setLoading(true);

      try {
        const response = await getHotel(hotelId);
        if (!cancelled) setHotel(response);
      } catch (detailsError) {
        if (!cancelled) setError(getApiErrorMessage(detailsError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHotel();

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  async function handleDelete() {
    if (!hotel) return;

    const confirmed = window.confirm(`Delete ${hotel.name}? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteHotel(hotel.id);
      router.push("/hotels");
      router.refresh();
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg border border-[#1e3350] bg-[#0b1f3a]/70" />;
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm text-[#91a4bc] hover:text-white" href="/hotels">
        <ArrowLeft aria-hidden size={16} />
        Hotels
      </Link>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {hotel ? (
        <>
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#f97316]">
                <Building2 aria-hidden size={20} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">{hotel.code}</span>
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">{hotel.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#91a4bc]">
                Hotel profile, contact details, and operational defaults.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#1e3350] bg-[#102a4c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#173a67]"
                href={`/hotels/${hotel.id}/edit`}
              >
                <Pencil aria-hidden size={18} />
                Edit
              </Link>
              <Button disabled={deleting} onClick={handleDelete} type="button" variant="ghost">
                <Trash2 aria-hidden size={18} />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Profile</h2>
                <Badge className={hotel.is_active ? undefined : "border-[#60758f] bg-[#60758f]/10 text-[#91a4bc]"}>
                  {hotel.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <DetailRow label="Currency" value={hotel.currency} />
              <DetailRow label="Timezone" value={hotel.timezone} />
              <DetailRow label="Address" value={hotel.address} />
              <DetailRow label="Created" value={formatDate(hotel.created_at)} />
              <DetailRow label="Updated" value={formatDate(hotel.updated_at)} />
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Contact</h2>
              <p className="flex items-center gap-2 text-sm text-[#91a4bc]">
                <Mail aria-hidden className="text-[#f97316]" size={16} />
                <span className="truncate">{hotel.email || "No email set"}</span>
              </p>
              <p className="flex items-center gap-2 text-sm text-[#91a4bc]">
                <Phone aria-hidden className="text-[#f97316]" size={16} />
                <span>{hotel.phone || "No phone set"}</span>
              </p>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <p className="flex justify-between gap-4 border-b border-[#1e3350] pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-[#91a4bc]">{label}</span>
      <span className="max-w-[65%] text-right text-white">{value || "Not set"}</span>
    </p>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
