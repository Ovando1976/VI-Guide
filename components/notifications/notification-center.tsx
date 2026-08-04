"use client";

import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  NotificationAudience,
  ViNotification,
} from "@/types/notification";

const AUDIENCE_LABELS: Record<NotificationAudience, string> = {
  traveler: "Traveler",
  merchant: "Merchant",
  operations: "Operations",
};

export function NotificationCenter({
  audience = "traveler",
}: {
  audience?: NotificationAudience;
}) {
  const [notifications, setNotifications] = useState<ViNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?audience=${audience}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { notifications?: ViNotification[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load notifications.");
      }
      setNotifications(payload?.notifications ?? []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load notifications.",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications(true);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  async function setRead(notification: ViNotification, read: boolean) {
    setSavingId(notification.id);
    setError(null);
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { notification?: { readAt?: string | null; updatedAt?: string }; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update notification.");
      }
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                readAt: payload?.notification?.readAt ?? null,
                updatedAt:
                  payload?.notification?.updatedAt ?? item.updatedAt,
              }
            : item,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update notification.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function markAllRead() {
    for (const notification of notifications.filter((item) => !item.readAt)) {
      await setRead(notification, true);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                {AUDIENCE_LABELS[audience]} notifications
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Notification Center
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Booking updates, mission guidance, provider changes, Concierge actions, and operational alerts in one live inbox.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.15em]"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
              </button>
              <button
                type="button"
                disabled={!unreadCount}
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-[#043331] disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            </div>
          </div>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.15em] text-white/75">
            <BellRing className="h-4 w-4 text-[#f5c451]" /> {unreadCount} unread
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-[28px] border p-5 shadow-sm sm:p-6 ${
                  notification.readAt
                    ? "border-slate-200 bg-white"
                    : notification.priority === "high"
                      ? "border-amber-300 bg-amber-50"
                      : "border-teal-200 bg-teal-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#043331] text-white">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                        {notification.kind}
                        {notification.reference
                          ? ` · ${notification.reference}`
                          : ""}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-black tracking-[-.03em]">
                      {notification.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {notification.message}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          className="inline-flex min-h-10 items-center rounded-xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white"
                        >
                          Open update
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={savingId === notification.id}
                        onClick={() =>
                          void setRead(notification, !notification.readAt)
                        }
                        className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
                      >
                        {savingId === notification.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : notification.readAt ? (
                          "Mark unread"
                        ) : (
                          "Mark read"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <Bell className="mx-auto h-10 w-10 text-teal-700" />
              <h2 className="mt-4 text-2xl font-black">No notifications yet</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Booking, mission, provider, Concierge, and operations updates will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
