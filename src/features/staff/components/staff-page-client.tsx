"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, HotelMembership, Role } from "@/lib/api/types";
import { listHotels } from "@/features/hotels/api";
import {
  createStaffMembership,
  deleteStaffMembership,
  listStaffMemberships,
  updateStaffMembership
} from "@/features/staff/api";

const roles: Array<{ label: string; value: Role }> = [
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Cashier", value: "cashier" },
  { label: "Chef", value: "chef" },
  { label: "Waiter", value: "waiter" }
];

export function StaffPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [memberships, setMemberships] = useState<HotelMembership[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadStaff() {
    setError(null);
    setLoading(true);

    try {
      const [hotelsResponse, membershipsResponse] = await Promise.all([
        listHotels({ page_size: 100 }),
        listStaffMemberships({ page_size: 100 })
      ]);
      setHotels(hotelsResponse.results);
      setMemberships(membershipsResponse.results);
    } catch (staffError) {
      setError(getApiErrorMessage(staffError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  const hotelById = useMemo(
    () => new Map(hotels.map((hotel) => [hotel.id, hotel])),
    [hotels]
  );

  async function handleAddEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const user = String(formData.get("user") ?? "").trim();
    const hotel = String(formData.get("hotel") ?? "").trim();
    const role = String(formData.get("role") ?? "waiter") as Role;

    try {
      await createStaffMembership({
        hotel,
        is_active: formData.get("is_active") === "on",
        role,
        user
      });
      form.reset();
      await loadStaff();
    } catch (addError) {
      setError(getApiErrorMessage(addError));
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(membership: HotelMembership, role: Role) {
    setBusyId(membership.id);
    setError(null);

    try {
      const updated = await updateStaffMembership(membership.id, { role });
      setMemberships((current) =>
        current.map((item) => (item.id === membership.id ? updated : item))
      );
    } catch (roleError) {
      setError(getApiErrorMessage(roleError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleActiveChange(membership: HotelMembership, isActive: boolean) {
    setBusyId(membership.id);
    setError(null);

    try {
      const updated = await updateStaffMembership(membership.id, { is_active: isActive });
      setMemberships((current) =>
        current.map((item) => (item.id === membership.id ? updated : item))
      );
    } catch (activeError) {
      setError(getApiErrorMessage(activeError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(membership: HotelMembership) {
    const hotelName = hotelById.get(membership.hotel)?.name ?? "this hotel";
    const confirmed = window.confirm(`Remove user ${membership.user} from ${hotelName}?`);
    if (!confirmed) return;

    setBusyId(membership.id);
    setError(null);

    try {
      await deleteStaffMembership(membership.id);
      setMemberships((current) => current.filter((item) => item.id !== membership.id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
          Memberships API
        </Badge>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Staff</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-base text-slate-500">
            Add existing backend users to hotels, change roles, deactivate access, or remove
            memberships entirely.
          </p>
          <Button 
            className="h-10 rounded-lg font-medium shadow-sm" 
            disabled={loading} 
            onClick={loadStaff} 
            type="button" 
            variant="secondary"
          >
            <RefreshCw aria-hidden size={16} className="mr-2 text-slate-500" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500">
            <UserPlus aria-hidden size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Add employee to hotel</h2>
        </div>

        <form className="grid gap-4 lg:gap-6 lg:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_auto] lg:items-end" onSubmit={handleAddEmployee}>
          <Input
            disabled={saving}
            label="User ID"
            name="user"
            placeholder="Existing user UUID"
            required
          />
          <Select disabled={saving || hotels.length === 0} label="Hotel" name="hotel" required>
            <option value="">Select hotel</option>
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </Select>
          <Select defaultValue="waiter" disabled={saving} label="Role" name="role" required>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          <div className="self-end pb-2 lg:pb-3">
            <Checkbox defaultChecked disabled={saving} key={saving ? "saving" : "ready"} label="Active" name="is_active" />
          </div>
          <Button className="h-10 w-full rounded-lg font-medium shadow-sm lg:w-auto" disabled={saving || hotels.length === 0} type="submit">
            {saving ? "Adding..." : "Add"}
          </Button>
        </form>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500">
            <Users aria-hidden size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Staff memberships</h2>
          <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
            {memberships.length}
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-[104px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50"
                key={index}
              />
            ))}
          </div>
        ) : memberships.length > 0 ? (
          <div className="grid gap-3">
            {memberships.map((membership) => (
              <StaffMembershipRow
                busy={busyId === membership.id}
                hotel={hotelById.get(membership.hotel)}
                key={membership.id}
                membership={membership}
                onActiveChange={handleActiveChange}
                onRemove={handleRemove}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">No staff memberships were returned by the API.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function StaffMembershipRow({
  busy,
  hotel,
  membership,
  onActiveChange,
  onRemove,
  onRoleChange
}: {
  busy: boolean;
  hotel?: Hotel;
  membership: HotelMembership;
  onActiveChange: (membership: HotelMembership, isActive: boolean) => void;
  onRemove: (membership: HotelMembership) => void;
  onRoleChange: (membership: HotelMembership, role: Role) => void;
}) {
  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md grid gap-4 lg:gap-6 lg:grid-cols-[1.2fr_1fr_0.8fr_0.7fr_auto] lg:items-end">
      <div className="min-w-0 pb-1 lg:pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Employee user ID</p>
        <p className="mt-1.5 truncate text-sm font-medium text-slate-900">{membership.user}</p>
      </div>

      <div className="min-w-0 pb-1 lg:pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hotel</p>
        <p className="mt-1.5 truncate text-sm font-medium text-slate-900">
          {hotel?.name ?? membership.hotel}
        </p>
      </div>

      <Select
        disabled={busy}
        label="Role"
        onChange={(event) => onRoleChange(membership, event.target.value as Role)}
        value={membership.role ?? "waiter"}
      >
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </Select>

      <div className="pb-2 lg:pb-3">
        <Checkbox
          checked={membership.is_active !== false}
          disabled={busy}
          label="Active"
          onChange={(event) => onActiveChange(membership, event.target.checked)}
        />
      </div>

      <div className="flex items-center gap-3 pb-1 lg:pb-2">
        <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck aria-hidden size={14} className="mr-1.5 text-slate-500" />
          {formatRole(membership.role ?? "staff")}
        </Badge>
        <Button 
          disabled={busy} 
          onClick={() => onRemove(membership)} 
          type="button" 
          variant="ghost"
          className="h-9 text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <Trash2 aria-hidden size={16} className="mr-2" />
          Remove
        </Button>
      </div>
    </Card>
  );
}

function formatRole(role: string) {
  return role.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}