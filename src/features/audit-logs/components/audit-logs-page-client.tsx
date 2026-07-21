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
    <div className="space-y-6 md:space-y-8">
      <div>
        <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
          Audit Logs API
        </Badge>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Audit logs</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-base text-slate-500">
            Owner/Admin read-only activity history for traceable operational changes.
          </p>
          <Button 
            className="h-10 rounded-lg font-medium shadow-sm" 
            disabled={loading} 
            onClick={() => loadAuditLogs()} 
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
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
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

          <form className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto]" onSubmit={handleSearch}>
            <Input
              disabled={loading || !canViewAuditLogs}
              label="Search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Action, model, object ID, path..."
              value={search}
            />
            <Button className="h-10 self-end font-medium shadow-sm" disabled={loading || !canViewAuditLogs} type="submit" variant="secondary">
              <Search aria-hidden size={16} className="mr-2 text-slate-500" />
              Search
            </Button>
          </form>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {selectedMembership?.role ? formatLabel(selectedMembership.role) : "No membership"}
            </p>
          </div>
        </div>
      </Card>

      {!loading && !canViewAuditLogs ? (
        <Card className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex gap-4">
            <ShieldAlert aria-hidden className="mt-0.5 shrink-0 text-red-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-900">Owner/Admin only</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-red-700">
                Audit logs are restricted to hotel owners and admins. Your current active hotel
                role does not have permission to view this table.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500">
              <FileClock aria-hidden size={18} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Read-only audit table</h2>
            <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
              {logs.length}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  className="h-[88px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50"
                  key={index}
                />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <AuditLogsTable logs={logs} />
          ) : (
            <Card className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-500">No audit logs were returned for this hotel.</p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5 whitespace-nowrap">Time</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Action</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Model</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Object</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Actor</th>
              <th className="px-5 py-3.5 whitespace-nowrap">Path</th>
              <th className="px-5 py-3.5 whitespace-nowrap">IP</th>
              <th className="px-5 py-3.5">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr className="align-top hover:bg-slate-50/50 transition-colors" key={log.id}>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  <Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {formatLabel(log.action)}
                  </Badge>
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">{log.model_name}</td>
                <td className="max-w-48 truncate px-5 py-4 font-mono text-[11px] text-slate-500">
                  {log.object_id}
                </td>
                <td className="max-w-48 truncate px-5 py-4 font-mono text-[11px] text-slate-500">
                  {log.actor ?? "System"}
                </td>
                <td className="max-w-64 truncate px-5 py-4 text-slate-500">{log.path ?? "Not set"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                  {log.ip_address ?? "Not set"}
                </td>
                <td className="max-w-80 px-5 py-4">
                  <code className="line-clamp-3 block whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-mono text-slate-600">
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