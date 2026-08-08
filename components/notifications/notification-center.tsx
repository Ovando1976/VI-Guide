"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BellRing,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCcw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ViPublicHeader } from "@/components/brand/vi-public-header";
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
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<ViNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (authLoading) return;
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `/api/notifications?audience=${audience}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );
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
    },
    [audience, authLoading, user],
  );

  useEffect(() => {
    void loadNotifications();
    if (!user) return;
    const timer = window.setInterval(() => {
      void loadNotifications(true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications, user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );
  const highPriorityCount = useMemo(
    () => notifications.filter((item) => item.priority === "high").length,
    [notifications],
  );
  const traveler = audience === "traveler";

  async function setRead(notification: ViNotification, read: boolean) {
    if (!user) return;
    setSavingId(notification.id);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            notification?: {
              readAt?: string | null;
              updatedAt?: string;
            };
            error?: string;
          }
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

  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-[#f8f4ea] px-4 py-5 pb-32 text-[#043331] sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl">
          {traveler ? (
            <ViPublicHeader
              actionHref="/login?next=%2Fnotifications"
              actionLabel="Sign in"
              actionIcon={ShieldCheck}
              secondaryHref="/profile"
              secondaryLabel="Traveler Profile"
            />
          ) : null}

          <section className="relative isolate mt-5 min-h-[34rem] overflow-hidden rounded-[36px] border border-white/20 bg-[#043331] text-white shadow-[0_30px_85px_rgba(4,51,49,.2)] sm:min-h-[38rem] lg:rounded-[42px]">
            {traveler ? (
              <Image
                src="/images/usvi-harbor-hero.jpg"
                alt="Charlotte Amalie harbor and the hills of St. Thomas"
                fill
                priority
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="-z-30 object-cover"
              />
            ) : null}
            <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.96)_0%,rgba(2,38,37,.78)_50%,rgba(2,38,37,.3)_100%)]" />
            <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,38,37,.92)_0%,rgba(2,38,37,.16)_70%,transparent_100%)]" />

            <div className="flex min-h-[34rem] items-end p-5 sm:min-h-[38rem] sm:p-8 lg:p-10">
              <div className="max-w-2xl rounded-[30px] border border-white/16 bg-[#032f2d]/82 p-6 shadow-[0_20px_60px_rgba(2,31,29,.24)] backdrop-blur-xl sm:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8ef0e7]/12 text-[#8ef0e7] ring-1 ring-white/10">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <p className="mt-5 text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                  Private traveler alerts
                </p>
                <h1 className="vi-display mt-2 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-5xl">
                  Your notification center is private.
                </h1>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/68">
                  Sign in to see booking updates and proactive alerts tied to your
                  verified traveler account. Your alert preferences remain under
                  your control in Traveler Profile.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/login?next=%2Fnotifications"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.15em] text-[#043331] transition hover:bg-[#ffdc76]"
                  >
                    Sign in <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-6 text-[9px] font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.13]"
                  >
                    Alert settings
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-5 pb-32 text-[#043331] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {traveler ? (
          <ViPublicHeader
            actionHref="/profile"
            actionLabel="Alert settings"
            actionIcon={Settings2}
            secondaryHref="/trips"
            secondaryLabel="My Trip"
          />
        ) : null}

        <section className="relative isolate mt-5 overflow-hidden rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_28px_75px_rgba(4,51,49,.17)] sm:p-10 lg:rounded-[42px]">
          {traveler ? (
            <Image
              src="/images/places/st-thomas/red-hook-ferry-terminal-1.jpg"
              alt="Red Hook ferry terminal in St. Thomas"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="-z-30 object-cover"
            />
          ) : null}
          <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.95)_0%,rgba(2,38,37,.77)_52%,rgba(2,38,37,.36)_100%)]" />
          <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_20%,rgba(126,232,219,.16),transparent_34%)]" />

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                {AUDIENCE_LABELS[audience]} notifications · private live inbox
              </p>
              <h1 className="vi-display mt-3 text-4xl font-black leading-[.94] tracking-[-.05em] sm:text-6xl">
                Stay ahead of what changes the trip.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/68">
                Booking updates, Concierge actions, and proactive trip-protection
                alerts stay together so the next decision is easy to find.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadNotifications()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-[9px] font-black uppercase tracking-[.15em] backdrop-blur-md transition hover:bg-white/[.15]"
              >
                <RefreshCcw className="h-4 w-4" /> Refresh
              </button>
              <button
                type="button"
                disabled={!unreadCount}
                onClick={() => void markAllRead()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.15em] text-[#043331] transition hover:bg-[#ffdc76] disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            </div>
          </div>

          <div className="mt-7 grid max-w-2xl gap-2 sm:grid-cols-3">
            <HeroStat value={unreadCount} label="Unread" icon={BellRing} />
            <HeroStat value={notifications.length} label="Total updates" icon={Bell} />
            <HeroStat value={highPriorityCount} label="High priority" icon={ShieldCheck} />
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#d9e6e2] bg-[#fffdf8] px-5 py-4 shadow-[0_12px_32px_rgba(4,51,49,.05)]">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#b16a18]">
              Profile-connected protection
            </p>
            <p className="mt-1 text-sm font-black text-[#043331]">
              Choose monitoring, channels, severity, and recovery alerts in Traveler Profile.
            </p>
          </div>
          {traveler ? (
            <Link
              href="/profile"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cfe0dc] bg-white px-4 text-[8px] font-black uppercase tracking-[.13em] text-[#0f766e] transition hover:border-[#9bcfc7]"
            >
              <Settings2 className="h-4 w-4" /> Manage alerts
            </Link>
          ) : null}
        </div>

        <section className="mt-6 space-y-4">
          {loading || authLoading ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_14px_38px_rgba(4,51,49,.05)]">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : notifications.length ? (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className={`overflow-hidden rounded-[28px] border p-5 shadow-[0_14px_38px_rgba(4,51,49,.05)] transition sm:p-6 ${
                  notification.readAt
                    ? "border-[#d9e6e2] bg-[#fffdf8]"
                    : notification.priority === "high"
                      ? "border-amber-300 bg-[#fff8e7]"
                      : "border-[#b9dfd9] bg-[#f0faf7]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                      notification.readAt
                        ? "bg-[#e8f1ee] text-[#0f766e]"
                        : "bg-[#043331] text-[#f5c451]"
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#0f766e]">
                          {notification.kind}
                          {notification.reference
                            ? ` · ${notification.reference}`
                            : ""}
                        </p>
                        {!notification.readAt ? (
                          <span className="rounded-full bg-[#043331] px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] text-[#f5c451]">
                            New
                          </span>
                        ) : null}
                        {notification.priority === "high" ? (
                          <span className="rounded-full bg-amber-200 px-2 py-1 text-[7px] font-black uppercase tracking-[.12em] text-amber-900">
                            High priority
                          </span>
                        ) : null}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#82938f]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <h2 className="vi-display mt-2 text-2xl font-black tracking-[-.035em]">
                      {notification.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#617570]">
                      {notification.message}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[.06] pt-4">
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#043331] px-4 text-[8px] font-black uppercase tracking-[.14em] text-white transition hover:bg-[#075e58]"
                        >
                          Open update <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={savingId === notification.id}
                        onClick={() =>
                          void setRead(notification, !notification.readAt)
                        }
                        className="inline-flex min-h-10 items-center rounded-full border border-[#ccdcd8] bg-white px-4 text-[8px] font-black uppercase tracking-[.14em] text-[#4d6560] transition hover:border-[#9bcfc7] disabled:opacity-50"
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
            <div className="relative isolate min-h-[340px] overflow-hidden rounded-[32px] border border-white/20 bg-[#043331] p-8 text-white shadow-[0_18px_50px_rgba(4,51,49,.12)]">
              {traveler ? (
                <Image
                  src="/images/beaches/st-thomas/magens-bay-1.jpg"
                  alt="Magens Bay in St. Thomas"
                  fill
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  className="-z-30 object-cover"
                />
              ) : null}
              <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.93),rgba(2,38,37,.64),rgba(2,38,37,.38))]" />
              <div className="max-w-xl">
                <Bell className="h-10 w-10 text-[#8ef0e7]" />
                <p className="mt-5 text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                  All clear
                </p>
                <h2 className="vi-display mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">
                  No private notifications yet.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/68">
                  Booking and proactive trip-protection updates tied to your
                  account will appear here. You can tune what matters in Traveler Profile.
                </p>
                {traveler ? (
                  <Link
                    href="/profile"
                    className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[8px] font-black uppercase tracking-[.14em] text-[#043331]"
                  >
                    Review alert settings <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HeroStat({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: typeof Bell;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-[#032f2d]/58 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-black">{value}</span>
        <Icon className="h-4 w-4 text-[#8ef0e7]" />
      </div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/48">
        {label}
      </div>
    </div>
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
