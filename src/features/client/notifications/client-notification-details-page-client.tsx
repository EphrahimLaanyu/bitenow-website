"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Bell, Check, Circle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Notification } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { getAccessToken } from "@/lib/auth/token-storage";
import { getActiveHotelId, saveActiveHotelId } from "@/lib/hotels/active-hotel-storage";
import { getNotification, markNotificationRead } from "@/features/notifications/api";

export function ClientNotificationDetailsPageClient({ notificationId }: { notificationId: string }) {
  const { bootstrapSession, status } = useAuth();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotification = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      setError(null);
      if (quiet) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        if (status === "unauthenticated" && getAccessToken()) {
          await bootstrapSession();
        }

        const activeHotelId = getActiveHotelId();
        const loaded = await getNotification(notificationId, activeHotelId ?? undefined);
        saveActiveHotelId(loaded.hotel);

        if (!loaded.is_read) {
          const updated = await markNotificationRead(loaded.id, loaded.hotel).catch(() => loaded);
          setNotification(updated);
        } else {
          setNotification(loaded);
        }
      } catch (notificationError) {
        setError(getApiErrorMessage(notificationError));
        if (!quiet) setNotification(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [bootstrapSession, notificationId, status]
  );

  useEffect(() => {
    void loadNotification();
  }, [loadNotification]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface-2)]/70" />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <h1 className="text-xl font-extrabold text-[var(--foreground)]">Notification unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {error ?? "We could not load this notification."}
          </p>
        </Card>
      </div>
    );
  }

  const isRead = notification.is_read === true;

  return (
    <div className="space-y-7">
      <BackLink />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge>{notification.category || "General"}</Badge>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
              {notification.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Received {formatDate(notification.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={isRead ? "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" : undefined}>
              {isRead ? "Read" : "Unread"}
            </Badge>
            <Button disabled={refreshing} onClick={() => loadNotification({ quiet: true })} type="button" variant="secondary">
              <RefreshCw aria-hidden className={refreshing ? "animate-spin" : undefined} size={17} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
          <div className="flex items-start gap-3">
            <span className={isRead ? "mt-1 text-[var(--muted)]" : "mt-1 text-[var(--primary)]"}>
              {isRead ? <Check aria-hidden size={20} /> : <Circle aria-hidden size={20} />}
            </span>
            <p className="text-base leading-8 text-[var(--foreground)]">{notification.message}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailStat label="Status" value={isRead ? "Read" : "Unread"} />
          <DetailStat label="Read at" value={notification.read_at ? formatDate(notification.read_at) : "Not read yet"} />
        </div>

        {notification.payload ? (
          <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
            <div className="flex items-center gap-2">
              <Bell aria-hidden className="text-[var(--primary)]" size={18} />
              <p className="text-sm font-extrabold text-[var(--foreground)]">Additional details</p>
            </div>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-2xl bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted)]">
              {JSON.stringify(notification.payload, null, 2)}
            </pre>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)]" href="/client/notifications">
      <ArrowLeft aria-hidden size={16} />
      Back to notifications
    </Link>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <p className="text-xs font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
