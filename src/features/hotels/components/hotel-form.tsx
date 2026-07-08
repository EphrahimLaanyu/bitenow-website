"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, HotelPayload } from "@/lib/api/types";
import { createHotel, updateHotel } from "@/features/hotels/api";

type HotelFormProps = {
  hotel?: Hotel;
  mode: "create" | "edit";
};

export function HotelForm({ hotel, mode }: HotelFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = getPayload(new FormData(event.currentTarget), mode);

    try {
      const savedHotel =
        mode === "create" ? await createHotel(payload) : await updateHotel(hotel!.id, payload);
      router.push(`/hotels/${savedHotel.id}`);
      router.refresh();
    } catch (formError) {
      setError(getApiErrorMessage(formError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-4xl">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            defaultValue={hotel?.name ?? ""}
            disabled={saving}
            label="Hotel name"
            name="name"
            placeholder="Maestro Grand Hotel"
            required
          />
          <Input
            defaultValue={hotel?.code ?? ""}
            disabled={saving}
            label="Hotel code"
            name="code"
            pattern="[-a-zA-Z0-9_]+"
            placeholder="maestro_grand"
            required
          />
          <Input
            defaultValue={hotel?.currency ?? ""}
            disabled={saving}
            label="Currency"
            maxLength={8}
            name="currency"
            placeholder="KES"
          />
          <Input
            defaultValue={hotel?.timezone ?? ""}
            disabled={saving}
            label="Timezone"
            name="timezone"
            placeholder="Africa/Nairobi"
          />
          <Input
            defaultValue={hotel?.email ?? ""}
            disabled={saving}
            label="Email"
            name="email"
            placeholder="frontdesk@hotel.com"
            type="email"
          />
          <Input
            defaultValue={hotel?.phone ?? ""}
            disabled={saving}
            label="Phone"
            name="phone"
            placeholder="+254..."
          />
        </div>

        <Textarea
          defaultValue={hotel?.address ?? ""}
          disabled={saving}
          label="Address"
          name="address"
          placeholder="Street, city, country"
        />

        <Checkbox defaultChecked={hotel?.is_active ?? true} disabled={saving} label="Hotel is active" name="is_active" />

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={saving} type="submit">
            <Save aria-hidden size={18} />
            {saving ? "Saving..." : mode === "create" ? "Create hotel" : "Save changes"}
          </Button>
          <Button onClick={() => router.back()} type="button" variant="ghost">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function getPayload(formData: FormData, mode: "create" | "edit"): HotelPayload {
  const optional = (key: string) => {
    const value = getString(formData, key);
    return mode === "create" && !value ? undefined : value;
  };

  return {
    address: optional("address"),
    code: getString(formData, "code"),
    currency: optional("currency"),
    email: optional("email"),
    is_active: formData.get("is_active") === "on",
    name: getString(formData, "name"),
    phone: optional("phone"),
    timezone: optional("timezone")
  };
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
