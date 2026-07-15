"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Armchair, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { DiningTable, DiningTableStatus, Hotel } from "@/lib/api/types";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listHotels } from "@/features/hotels/api";
import { createTable, deleteTable, listTables, updateTable } from "@/features/tables/api";

const tableStatuses: Array<{ label: string; value: DiningTableStatus }> = [
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Reserved", value: "reserved" },
  { label: "Out of Service", value: "out_of_service" }
];

export function TablesPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadTables(hotelIdOverride?: string) {
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
        return;
      }

      saveActiveHotelId(activeHotelId);
      const tablesResponse = await listTables({ hotel: activeHotelId, page_size: 100 });
      setTables(sortTables(tablesResponse.results));
    } catch (tablesError) {
      setError(getApiErrorMessage(tablesError));
      setTables([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hotelById = useMemo(
    () => new Map(hotels.map((hotel) => [hotel.id, hotel])),
    [hotels]
  );

  const statusCounts = useMemo(
    () =>
      tableStatuses.map((status) => ({
        ...status,
        count: tables.filter((table) => (table.status ?? "available") === status.value).length
      })),
    [tables]
  );

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadTables(hotelId);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaving(true);

    const formData = new FormData(form);
    const tableNumber = String(formData.get("table_number") ?? "").trim();
    const hotel = String(formData.get("hotel") || selectedHotelId);

    try {
      await createTable({
        capacity: getOptionalNumber(formData.get("capacity")),
        hotel,
        notes: getOptionalString(formData.get("notes")),
        status: String(formData.get("status") || "available") as DiningTableStatus,
        table_number: tableNumber
      });
      form.reset();
      await loadTables(hotel);
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(table: DiningTable, status: DiningTableStatus) {
    setError(null);
    setBusyId(table.id);

    try {
      const updated = await updateTable(table.id, { hotel: table.hotel, status });
      setTables((current) => sortTables(current.map((item) => (item.id === table.id ? updated : item))));
    } catch (statusError) {
      setError(getApiErrorMessage(statusError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, table: DiningTable) {
    event.preventDefault();
    setError(null);
    setBusyId(table.id);

    const formData = new FormData(event.currentTarget);
    const hotel = String(formData.get("hotel") || table.hotel);

    try {
      const updated = await updateTable(table.id, {
        capacity: getOptionalNumber(formData.get("capacity")),
        hotel,
        notes: getOptionalString(formData.get("notes")),
        status: String(formData.get("status") || table.status || "available") as DiningTableStatus,
        table_number: String(formData.get("table_number") ?? table.table_number).trim()
      });
      setTables((current) => sortTables(current.map((item) => (item.id === table.id ? updated : item))));
      setEditingId(null);
    } catch (updateError) {
      setError(getApiErrorMessage(updateError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(table: DiningTable) {
    const confirmed = window.confirm(`Delete table ${table.table_number}?`);
    if (!confirmed) return;

    setError(null);
    setBusyId(table.id);

    try {
      await deleteTable(table.id, table.hotel);
      setTables((current) => current.filter((item) => item.id !== table.id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge>Tables API</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Tables</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Manage restaurant tables, seating capacity, and live availability for the active hotel.
          </p>
          <Button disabled={loading} onClick={() => loadTables()} type="button" variant="secondary">
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

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Armchair aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Active hotel context</h2>
        </div>
        <Select
          disabled={loading || hotels.length === 0}
          label="Select hotel"
          onChange={(event) => handleHotelChange(event.target.value)}
          value={selectedHotelId}
        >
          <option value="">Select hotel</option>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {statusCounts.map((status) => (
          <Card key={status.value}>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{status.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{status.count}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Plus aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create table</h2>
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_1fr] lg:items-end" onSubmit={handleCreate}>
          <Select disabled={saving || hotels.length === 0} label="Hotel" name="hotel" required>
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
          <Input disabled={saving} label="Table" name="table_number" placeholder="Table 1" required />
          <Input disabled={saving} label="Capacity" min={0} name="capacity" placeholder="4" type="number" />
          <Select defaultValue="available" disabled={saving} label="Status" name="status">
            {tableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <div className="lg:col-span-3">
            <Textarea disabled={saving} label="Notes" name="notes" placeholder="Window seat, patio, private room..." />
          </div>
          <Button className="self-end" disabled={saving || hotels.length === 0} type="submit">
            {saving ? "Creating..." : "Create table"}
          </Button>
        </form>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Armchair aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Restaurant tables</h2>
          <Badge>{tables.length}</Badge>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-44 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
                key={index}
              />
            ))}
          </div>
        ) : tables.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) =>
              editingId === table.id ? (
                <TableEditCard
                  busy={busyId === table.id}
                  hotels={hotels}
                  key={table.id}
                  onCancel={() => setEditingId(null)}
                  onSubmit={handleUpdate}
                  table={table}
                />
              ) : (
                <TableCard
                  busy={busyId === table.id}
                  hotel={hotelById.get(table.hotel)}
                  key={table.id}
                  onDelete={handleDelete}
                  onEdit={() => setEditingId(table.id)}
                  onStatusChange={handleStatusChange}
                  table={table}
                />
              )
            )}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-[var(--muted)]">No tables were returned for this hotel yet.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function TableCard({
  busy,
  hotel,
  onDelete,
  onEdit,
  onStatusChange,
  table
}: {
  busy: boolean;
  hotel?: Hotel;
  onDelete: (table: DiningTable) => void;
  onEdit: () => void;
  onStatusChange: (table: DiningTable, status: DiningTableStatus) => void;
  table: DiningTable;
}) {
  const status = table.status ?? "available";

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Table</p>
          <h3 className="mt-2 truncate text-xl font-bold text-[var(--foreground)]">{table.table_number}</h3>
          <p className="mt-1 truncate text-sm text-[var(--muted)]">{hotel?.name ?? table.hotel}</p>
        </div>
        <Badge className={getStatusClassName(status)}>{formatStatus(status)}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TableMetric label="Capacity" value={table.capacity?.toString() ?? "Not set"} />
        <TableMetric label="Status" value={formatStatus(status)} />
      </div>

      {table.notes ? <p className="text-sm text-[var(--muted)]">{table.notes}</p> : null}

      <Select
        disabled={busy}
        label="Quick status"
        onChange={(event) => onStatusChange(table, event.target.value as DiningTableStatus)}
        value={status}
      >
        {tableStatuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={onEdit} type="button" variant="secondary">
          <Pencil aria-hidden size={16} />
          Edit
        </Button>
        <Button disabled={busy} onClick={() => onDelete(table)} type="button" variant="ghost">
          <Trash2 aria-hidden size={16} />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function TableEditCard({
  busy,
  hotels,
  onCancel,
  onSubmit,
  table
}: {
  busy: boolean;
  hotels: Hotel[];
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, table: DiningTable) => void;
  table: DiningTable;
}) {
  return (
    <Card>
      <form className="space-y-4" onSubmit={(event) => onSubmit(event, table)}>
        <Select defaultValue={table.hotel} disabled={busy} label="Hotel" name="hotel" required>
          {hotels.map((hotel) => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.name}
            </option>
          ))}
        </Select>
        <Input defaultValue={table.table_number} disabled={busy} label="Table" name="table_number" required />
        <Input
          defaultValue={table.capacity ?? ""}
          disabled={busy}
          label="Capacity"
          min={0}
          name="capacity"
          type="number"
        />
        <Select defaultValue={table.status ?? "available"} disabled={busy} label="Status" name="status">
          {tableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
        <Textarea defaultValue={table.notes ?? ""} disabled={busy} label="Notes" name="notes" />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} type="submit">
            Save changes
          </Button>
          <Button disabled={busy} onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TableMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
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

function getOptionalNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function sortTables(tables: DiningTable[]) {
  return [...tables].sort((first, second) =>
    first.table_number.localeCompare(second.table_number, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}

function formatStatus(status: DiningTableStatus) {
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function getStatusClassName(status: DiningTableStatus) {
  if (status === "available") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  if (status === "occupied") return "border-orange-500/40 bg-orange-500/10 text-orange-100";
  if (status === "reserved") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-slate-500/30 bg-slate-500/10 text-slate-100";
}
