"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileClock, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuditLog, Hotel, HotelMembership } from "@/lib/api/types";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listAuditLogs } from "@/features/audit-logs/api";
import { listHotels } from "@/features/hotels/api";
import { listStaffMemberships } from "@/features/staff/api";

const privilegedRoles = new Set(["owner", "admin"]);

export function AuditLogsPageClient() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [memberships, setMemberships] = useState<HotelMembership[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAuditLogs(options?: { hotelId?: string; search?: string }) {
    setError(null);
    setLoading(true);

    try {
      const [hotelsResponse, membershipsResponse] = await Promise.all([
        listHotels({ page_size: 100 }),
        listStaffMemberships({ page_size: 100 })
      ]);
      const hotelResults = hotelsResponse.results;
      const membershipResults = membershipsResponse.results;
      const activeHotelId = chooseActiveHotelId(
        hotelResults,
        options?.hotelId || selectedHotelId || getActiveHotelId()
      );

      setHotels(hotelResults);
      setMemberships(membershipResults);
      setSelectedHotelId(activeHotelId);

      if (!activeHotelId) {
        setLogs([]);
        return;
      }

      saveActiveHotelId(activeHotelId);

      if (!isPrivilegedForHotel(membershipResults, user?.id, activeHotelId)) {
        setLogs([]);
        return;
      }

      const logsResponse = await listAuditLogs(
        {
          hotel: activeHotelId,
          ordering: "-created_at",
          page_size: 100,
          search: options?.search ?? search
        },
        activeHotelId
      );
      setLogs(sortAuditLogs(logsResponse.results));
    } catch (auditError) {
      setError(getApiErrorMessage(auditError));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMembership = useMemo(
    () =>
      memberships.find(
        (membership) =>
          membership.hotel === selectedHotelId &&
          membership.user === user?.id &&
          membership.is_active !== false
      ) ?? null,
    [memberships, selectedHotelId, user?.id]
  );

  const canViewAuditLogs = selectedMembership
    ? privilegedRoles.has(selectedMembership.role ?? "")
    : false;

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadAuditLogs({ hotelId });
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadAuditLogs({ search });
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge>Audit Logs API</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Audit logs</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Owner/Admin read-only activity history for traceable operational changes.
          </p>
          <Button disabled={loading} onClick={() => loadAuditLogs()} type="button" variant="secondary">
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
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <Select
            disabled={loading || hotels.length === 0}
            label="Active hotel"
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

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
            <Input
              disabled={loading || !canViewAuditLogs}
              label="Search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Action, model, object ID, path..."
              value={search}
            />
            <Button className="self-end" disabled={loading || !canViewAuditLogs} type="submit" variant="secondary">
              <Search aria-hidden size={18} />
              Search
            </Button>
          </form>

          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Role</p>
            <p className="mt-1 text-sm font-bold text-[var(--foreground)]">
              {selectedMembership?.role ? formatLabel(selectedMembership.role) : "No membership"}
            </p>
          </div>
        </div>
      </Card>

      {!loading && !canViewAuditLogs ? (
        <Card className="border-red-500/30 bg-red-500/10">
          <div className="flex gap-3">
            <ShieldAlert aria-hidden className="mt-1 shrink-0 text-red-100" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-red-50">Owner/Admin only</h2>
              <p className="mt-2 text-sm leading-6 text-red-100">
                Audit logs are restricted to hotel owners and admins. Your current active hotel
                role does not have permission to view this table.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileClock aria-hidden className="text-[var(--accent)]" size={20} />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Read-only audit table</h2>
            <Badge>{logs.length}</Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
                  key={index}
                />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <AuditLogsTable logs={logs} />
          ) : (
            <Card>
              <p className="text-sm text-[var(--muted)]">No audit logs were returned for this hotel.</p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)] bg-[var(--surface-2)]/82 text-left text-sm">
          <thead className="bg-[var(--surface)] text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Time</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Object</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Path</th>
              <th className="px-4 py-3 font-semibold">IP</th>
              <th className="px-4 py-3 font-semibold">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {logs.map((log) => (
              <tr className="align-top text-[var(--foreground)]" key={log.id}>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge>{formatLabel(log.action)}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{log.model_name}</td>
                <td className="max-w-48 truncate px-4 py-3 font-mono text-xs text-[var(--muted)]">
                  {log.object_id}
                </td>
                <td className="max-w-48 truncate px-4 py-3 font-mono text-xs text-[var(--muted)]">
                  {log.actor ?? "System"}
                </td>
                <td className="max-w-64 truncate px-4 py-3 text-[var(--muted)]">{log.path ?? "Not set"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                  {log.ip_address ?? "Not set"}
                </td>
                <td className="max-w-80 px-4 py-3">
                  <code className="line-clamp-3 block whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--muted)]">
                    {formatJson(log.payload ?? log.after ?? log.before)}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

function isPrivilegedForHotel(memberships: HotelMembership[], userId: string | undefined, hotelId: string) {
  if (!userId) return false;

  return memberships.some(
    (membership) =>
      membership.user === userId &&
      membership.hotel === hotelId &&
      membership.is_active !== false &&
      privilegedRoles.has(membership.role ?? "")
  );
}

function sortAuditLogs(logs: AuditLog[]) {
  return [...logs].sort((first, second) => {
    const firstDate = new Date(first.created_at).getTime();
    const secondDate = new Date(second.created_at).getTime();
    return secondDate - firstDate;
  });
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatJson(value: unknown) {
  if (value === undefined || value === null || value === "") return "No payload";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
