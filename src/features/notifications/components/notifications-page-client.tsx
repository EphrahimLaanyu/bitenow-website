"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Circle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Hotel, Notification } from "@/lib/api/types";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listHotels } from "@/features/hotels/api";
import { listNotifications, markNotificationRead } from "@/features/notifications/api";

export function NotificationsPageClient() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadNotifications(hotelIdOverride?: string) {
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
        setNotifications([]);
        return;
      }

      saveActiveHotelId(activeHotelId);
      const notificationsResponse = await listNotifications({
        hotel: activeHotelId,
        ordering: "-created_at",
        page_size: 100
      });
      setNotifications(sortNotifications(notificationsResponse.results));
    } catch (notificationsError) {
      setError(getApiErrorMessage(notificationsError));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

  async function handleHotelChange(hotelId: string) {
    setSelectedHotelId(hotelId);
    if (hotelId) saveActiveHotelId(hotelId);
    await loadNotifications(hotelId);
  }

  async function handleMarkRead(notification: Notification) {
    setError(null);
    setBusyId(notification.id);

    try {
      const updated = await markNotificationRead(notification.id, notification.hotel);
      setNotifications((current) =>
        sortNotifications(current.map((item) => (item.id === notification.id ? updated : item)))
      );
    } catch (readError) {
      setError(getApiErrorMessage(readError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <Badge variant="outline" className="font-medium text-slate-600 border-slate-200">
          Notifications API
        </Badge>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-base text-slate-500">
            Review operational alerts for the active hotel and mark them as read.
          </p>
          <Button 
            className="h-10 rounded-lg font-medium shadow-sm" 
            disabled={loading} 
            onClick={() => loadNotifications()} 
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
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
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
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-3.5 text-center md:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Unread</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{unreadCount}</p>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-slate-500">
            <Bell aria-hidden size={18} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Notification panel</h2>
          <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700 hover:bg-slate-100 font-medium">
            {notifications.length}
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-[120px] animate-pulse rounded-xl border border-slate-200 bg-slate-50/50"
                key={index}
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                busy={busyId === notification.id}
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">No notifications were returned for this hotel.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function NotificationCard({
  busy,
  notification,
  onMarkRead
}: {
  busy: boolean;
  notification: Notification;
  onMarkRead: (notification: Notification) => void;
}) {
  const isRead = notification.is_read === true;

  return (
    <Card 
      className={`rounded-xl border p-5 transition-all ${
        isRead 
          ? "border-slate-200 bg-slate-50/50 shadow-none" 
          : "border-slate-200 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-start">
        <div className={`mt-0.5 shrink-0 ${isRead ? "text-slate-300" : "text-[var(--accent)]"}`}>
          {isRead ? <Check aria-hidden size={20} /> : <Circle aria-hidden size={20} className="fill-[var(--accent)]/10" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge 
              variant={isRead ? "secondary" : "default"} 
              className={isRead ? "bg-slate-100 text-slate-500 font-medium border border-slate-200" : "font-medium"}
            >
              {notification.category || "General"}
            </Badge>
            {!isRead ? (
              <Badge variant="outline" className="font-medium text-[var(--accent)] border-[var(--accent)]/20 bg-[var(--accent)]/5">
                Unread
              </Badge>
            ) : null}
          </div>
          <h3 className={`mt-2.5 text-base font-semibold ${isRead ? "text-slate-600" : "text-slate-900"}`}>
            {notification.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {notification.message}
          </p>
          <p className="mt-3 text-[13px] font-medium text-slate-400">
            {new Date(notification.created_at).toLocaleString()}
            {notification.read_at ? ` · Read ${new Date(notification.read_at).toLocaleString()}` : ""}
          </p>
        </div>
        <Button
          className={`h-9 font-medium ${isRead ? "text-slate-500 hover:bg-slate-200/50" : "shadow-sm"}`}
          disabled={busy || isRead}
          onClick={() => onMarkRead(notification)}
          type="button"
          variant={isRead ? "ghost" : "secondary"}
        >
          <Check aria-hidden size={16} className={isRead ? "mr-1.5" : "mr-1.5 text-slate-500"} />
          {isRead ? "Read" : "Mark read"}
        </Button>
      </div>
    </Card>
  );
}

function chooseActiveHotelId(hotels: Hotel[], preferredId: string | null) {
  if (preferredId && hotels.some((hotel) => hotel.id === preferredId)) {
    return preferredId;
  }

  return hotels[0]?.id ?? "";
}

function sortNotifications(notifications: Notification[]) {
  return [...notifications].sort((first, second) => {
    const firstDate = new Date(first.created_at).getTime();
    const secondDate = new Date(second.created_at).getTime();
    return secondDate - firstDate;
  });
}