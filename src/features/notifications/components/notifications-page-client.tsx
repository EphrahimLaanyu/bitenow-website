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
    <div className="space-y-6">
      <div>
        <Badge>Notifications API</Badge>
        <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">Notifications</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Review operational alerts for the active hotel and mark them as read.
          </p>
          <Button disabled={loading} onClick={() => loadNotifications()} type="button" variant="secondary">
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
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Unread</p>
            <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{unreadCount}</p>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell aria-hidden className="text-[var(--accent)]" size={20} />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Notification panel</h2>
          <Badge>{notifications.length}</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70"
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
          <Card>
            <p className="text-sm text-[var(--muted)]">No notifications were returned for this hotel.</p>
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
    <Card className={isRead ? "bg-[var(--surface-2)]/55" : "border-[var(--accent)]/45 bg-[var(--surface-2)]/80"}>
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-start">
        <div className="mt-1 text-[var(--accent)]">
          {isRead ? <Check aria-hidden size={18} /> : <Circle aria-hidden size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={isRead ? "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" : undefined}>
              {notification.category || "General"}
            </Badge>
            {!isRead ? <Badge>Unread</Badge> : null}
          </div>
          <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">{notification.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notification.message}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {new Date(notification.created_at).toLocaleString()}
            {notification.read_at ? ` · Read ${new Date(notification.read_at).toLocaleString()}` : ""}
          </p>
        </div>
        <Button
          disabled={busy || isRead}
          onClick={() => onMarkRead(notification)}
          type="button"
          variant={isRead ? "secondary" : "primary"}
        >
          <Check aria-hidden size={16} />
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
