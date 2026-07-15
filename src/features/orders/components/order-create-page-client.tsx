"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPlus, Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import type { DiningTable, Hotel, MenuItem, OrderStatus, OrderType } from "@/lib/api/types";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listHotels } from "@/features/hotels/api";
import { listMenuItems } from "@/features/menu/api";
import { createOrder } from "@/features/orders/api";
import { formatMoney, generateOrderNumber, orderStatuses, orderTypes } from "@/features/orders/order-utils";
import { listTables } from "@/features/tables/api";

type DraftOrderItem = {
  menuItemId: string;
  name: string;
  notes?: string;
  quantity: number;
  unitPrice: string;
};

export function OrderCreatePageClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [orderNumber] = useState(() => generateOrderNumber());
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadContext(hotelIdOverride?: string) {
    setError(null);
    setLoading(true);

    try {
      const hotelsResponse = await listHotels({ page_size: 100 });
      const hotelResults = hotelsResponse.results;
      const activeHotelId = chooseActiveHotelId(
        hotelResults,
        hotelIdOverride || selectedHotelId || getActiveHotelId()
      );

      setHotels(hotelResults);
      setSelectedHotelId(activeHotelId);

      if (!activeHotelId) {
        setTables([]);
        setMenuItems([]);
        return;
      }

      saveActiveHotelId(activeHotelId);
      const [tablesResponse, menuResponse] = await Promise.all([
        listTables({ hotel: activeHotelId, page_size: 100 }),
        listMenuItems({ hotel: activeHotelId, page_size: 100 })
      ]);
      setTables(tablesResponse.results);
      setMenuItems(menuResponse.results.filter((item) => item.is_available !== false));
      setDraftItems([]);
    } catch (contextError) {
      setError(getApiErrorMessage(contextError));
      setTables([]);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadContext(hotelId);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setValidationErrors([]);
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const hotel = String(formData.get("hotel") || selectedHotelId);
    const createdBy = String(formData.get("created_by") || user?.id || "").trim();
    const payload = {
      created_by: createdBy,
      customer_name: getOptionalString(formData.get("customer_name")),
      customer_phone: getOptionalString(formData.get("customer_phone")),
      hotel,
      items: draftItems.map((item) => ({
        menu_item: item.menuItemId,
        notes: item.notes,
        quantity: item.quantity,
        unit_price: item.unitPrice
      })),
      notes: getOptionalString(formData.get("notes")),
      order_number: String(formData.get("order_number") || orderNumber).trim(),
      order_type: String(formData.get("order_type") || "dine_in") as OrderType,
      status: String(formData.get("status") || "draft") as OrderStatus,
      table: getNullableString(formData.get("table"))
    };

    try {
      if (draftItems.length === 0) {
        throw new Error("Add at least one menu item before creating the order.");
      }

      const order = await createOrder(payload);

      router.push(`/orders/${order.id}`);
    } catch (createError) {
      setError(getApiErrorMessage(createError));
      setValidationErrors(getValidationErrors(createError));
    } finally {
      setSaving(false);
    }
  }

  function handleAddDraftItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setValidationErrors([]);

    const formData = new FormData(event.currentTarget);
    const menuItemId = String(formData.get("menu_item") ?? "");
    const menuItem = menuItems.find((item) => item.id === menuItemId);

    if (!menuItem) {
      setError("Choose a menu item before adding it to the order.");
      return;
    }

    const quantity = getPositiveNumber(formData.get("quantity")) ?? 1;
    const notes = getOptionalString(formData.get("item_notes"));

    setDraftItems((current) => {
      const existing = current.find((item) => item.menuItemId === menuItem.id && item.notes === notes);
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...current,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          notes,
          quantity,
          unitPrice: menuItem.price
        }
      ];
    });

    event.currentTarget.reset();
  }

  function handleDraftQuantityChange(index: number, delta: number) {
    setDraftItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }

  function handleRemoveDraftItem(index: number) {
    setDraftItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId);
  const total = draftItems.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <Badge>Orders API</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Create order</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Start a dine-in, takeaway, or delivery order for the selected hotel.
          </p>
          <Button disabled={loading} onClick={() => loadContext()} type="button" variant="secondary">
            <RefreshCw aria-hidden size={18} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <p className="font-semibold">Backend validation errors</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationErrors.map((validationError) => (
              <li key={validationError}>{validationError}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <ClipboardPlus aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Order details</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Select
            disabled={saving || hotels.length === 0}
            label="Hotel"
            name="hotel"
            onChange={(event) => handleHotelChange(event.target.value)}
            required
            form="create-order-form"
            value={selectedHotelId}
          >
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
          <Input defaultValue={orderNumber} disabled={saving} form="create-order-form" label="Order number" maxLength={32} name="order_number" required />
          <Input
            defaultValue={user?.id ?? ""}
            disabled={saving}
            form="create-order-form"
            label="Created by user ID"
            name="created_by"
            pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
            placeholder="Current user UUID"
            required
          />
          <Select defaultValue="dine_in" disabled={saving} form="create-order-form" label="Order type" name="order_type">
            {orderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
          <Select defaultValue="draft" disabled={saving} form="create-order-form" label="Initial status" name="status">
            {orderStatuses.slice(0, 3).map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select disabled={saving || tables.length === 0} form="create-order-form" label="Table" name="table">
            <option value="">No table</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.table_number}
              </option>
            ))}
          </Select>
          <Input disabled={saving} form="create-order-form" label="Customer name" maxLength={255} name="customer_name" placeholder="Walk-in customer" />
          <Input disabled={saving} form="create-order-form" label="Customer phone" maxLength={32} name="customer_phone" placeholder="+254..." />
          <div className="lg:col-span-2">
            <Textarea disabled={saving} form="create-order-form" label="Notes" name="notes" placeholder="Special requests, delivery notes, allergy notes..." />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Plus aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Order items</h2>
        </div>

        <form className="grid gap-4 lg:grid-cols-[1.4fr_0.5fr_1fr_auto]" onSubmit={handleAddDraftItem}>
          <Select disabled={saving || menuItems.length === 0} label="Menu item" name="menu_item" required>
            <option value="">Select item</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {formatMoney(item.price, selectedHotel?.currency)}
              </option>
            ))}
          </Select>
          <Input defaultValue={1} disabled={saving} label="Qty" min={1} name="quantity" type="number" />
          <Input disabled={saving} label="Notes" maxLength={255} name="item_notes" placeholder="No onions, extra sauce..." />
          <Button className="self-end" disabled={saving || menuItems.length === 0} type="submit">
            <Plus aria-hidden size={16} />
            Add item
          </Button>
        </form>

        <div className="mt-5 space-y-3">
          {draftItems.length > 0 ? (
            draftItems.map((item, index) => (
              <DraftItemRow
                currency={selectedHotel?.currency}
                item={item}
                key={`${item.menuItemId}-${item.notes ?? "none"}-${index}`}
                onQuantityChange={(delta) => handleDraftQuantityChange(index, delta)}
                onRemove={() => handleRemoveDraftItem(index)}
              />
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Add Burger, Fries, Drinks, or any available menu item before creating the order.
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Estimated subtotal</p>
            <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{formatMoney(total, selectedHotel?.currency)}</p>
          </div>
          <form id="create-order-form" onSubmit={handleCreate}>
            <div className="lg:col-span-2">
              <Button disabled={saving || hotels.length === 0 || draftItems.length === 0} type="submit">
                {saving ? "Creating..." : "Create order"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function DraftItemRow({
  currency,
  item,
  onQuantityChange,
  onRemove
}: {
  currency?: string;
  item: DraftOrderItem;
  onQuantityChange: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
        {item.notes ? <p className="mt-1 text-xs text-[var(--muted)]">{item.notes}</p> : null}
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Unit price</p>
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatMoney(item.unitPrice, currency)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Line total</p>
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
          {formatMoney(Number(item.unitPrice || 0) * item.quantity, currency)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={item.quantity <= 1} onClick={() => onQuantityChange(-1)} type="button" variant="secondary">
          <Minus aria-hidden size={16} />
        </Button>
        <span className="min-w-10 text-center text-sm font-bold text-[var(--foreground)]">{item.quantity}</span>
        <Button onClick={() => onQuantityChange(1)} type="button" variant="secondary">
          <Plus aria-hidden size={16} />
        </Button>
        <Button onClick={onRemove} type="button" variant="ghost">
          <Trash2 aria-hidden size={16} />
          Remove
        </Button>
      </div>
    </div>
  );
}

function chooseActiveHotelId(hotels: Hotel[], preferredId: string | null) {
  if (preferredId && hotels.some((hotel) => hotel.id === preferredId)) {
    return preferredId;
  }

  return hotels[0]?.id ?? "";
}

function getOptionalString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || undefined;
}

function getNullableString(value: FormDataEntryValue | null) {
  const parsed = String(value ?? "").trim();
  return parsed || null;
}

function getPositiveNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getValidationErrors(error: unknown) {
  if (!(error instanceof ApiError)) return [];
  return flattenValidationDetails(error.details);
}

function flattenValidationDetails(details: unknown, path = ""): string[] {
  if (!details) return [];

  if (typeof details === "string") {
    return [`${path || "detail"}: ${details}`];
  }

  if (Array.isArray(details)) {
    return details.flatMap((item, index) =>
      flattenValidationDetails(item, path ? `${path}[${index}]` : `[${index}]`)
    );
  }

  if (typeof details === "object") {
    return Object.entries(details).flatMap(([key, value]) =>
      flattenValidationDetails(value, path ? `${path}.${key}` : key)
    );
  }

  return [`${path || "detail"}: ${String(details)}`];
}
