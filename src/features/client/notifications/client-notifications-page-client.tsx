"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, Check, Circle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Notification } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import { getActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { listNotifications, markNotificationRead } from "@/features/notifications/api";

export function ClientNotificationsPageClient() {
  const { bootstrapSession, status } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadNotifications() {
    setError(null);
    setLoading(true);

    const hotelId = getActiveHotelId();
    setActiveHotelId(hotelId);

    if (!hotelId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      if (status === "unauthenticated" && getAccessToken()) {
        await bootstrapSession();
      }

      const response = await listNotifications({
        hotel: hotelId,
        ordering: "-created_at",
        page_size: 100
      });
      setNotifications(sortNotifications(response.results));
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
  }, [status]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  );

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
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge>Notifications</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
            Important updates
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Track order, payment, and hotel updates in one simple guest notification center.
          </p>
        </div>

        <Button disabled={loading} onClick={loadNotifications} type="button" variant="secondary">
          <RefreshCw aria-hidden size={18} />
          Refresh
        </Button>
      </section>

      {status === "checking" ? (
        <Card>
          <p className="text-sm text-[var(--muted)]">Checking your session...</p>
        </Card>
      ) : null}

      {status === "unauthenticated" && !getAccessToken() ? (
        <Card>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Sign in to view notifications</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Notifications are attached to your BiteNow account.
          </p>
          <Link
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)]"
            href="/login?next=%2Fclient%2Fnotifications"
          >
            Sign in
          </Link>
        </Card>
      ) : null}

      {!activeHotelId ? (
        <Card>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Choose a hotel first</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Open a hotel before viewing notifications connected to that dining session.
          </p>
          <Link className="app-link mt-4 inline-flex items-center gap-2" href="/client/hotels">
            Browse hotels
            <ArrowRight aria-hidden size={16} />
          </Link>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="All notifications" value={notifications.length} />
          <Stat label="Unread" value={unreadCount} />
          <Stat label="Read" value={notifications.length - unreadCount} />
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell aria-hidden className="text-[var(--primary)]" size={20} />
          <h2 className="text-lg font-extrabold text-[var(--foreground)]">Notification list</h2>
          <Badge>{notifications.length}</Badge>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-32 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/70"
                key={index}
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <ClientNotificationCard
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

function ClientNotificationCard({
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
    <Card className={isRead ? "bg-[var(--surface-3)]" : "border-[var(--primary)]/35 bg-[var(--primary)]/5"}>
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
        <div className={isRead ? "mt-1 text-[var(--muted)]" : "mt-1 text-[var(--primary)]"}>
          {isRead ? <Check aria-hidden size={19} /> : <Circle aria-hidden size={19} />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={isRead ? "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" : undefined}>
              {notification.category || "General"}
            </Badge>
            {!isRead ? <Badge>Unread</Badge> : null}
          </div>
          <Link
            className="mt-3 block text-xl font-extrabold text-[var(--foreground)] hover:text-[var(--primary)]"
            href={`/client/notifications/${notification.id}`}
          >
            {notification.title}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{notification.message}</p>
          <p className="mt-3 text-xs font-semibold text-[var(--muted)]">{formatDate(notification.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--foreground)] shadow-sm transition-colors hover:border-[var(--primary)]"
            href={`/client/notifications/${notification.id}`}
          >
            Details
          </Link>
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
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function sortNotifications(notifications: Notification[]) {
  return [...notifications].sort((first, second) => {
    const firstDate = new Date(first.created_at).getTime();
    const secondDate = new Date(second.created_at).getTime();
    return secondDate - firstDate;
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
