import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HotelForm } from "@/features/hotels/components/hotel-form";

export default function NewHotelPage() {
  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]" href="/hotels">
        <ArrowLeft aria-hidden size={16} />
        Hotels
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Create hotel</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Add a hotel profile for ordering, staff access, menu setup, tables, and payments.
        </p>
      </div>

      <HotelForm mode="create" />
    </div>
  );
}
