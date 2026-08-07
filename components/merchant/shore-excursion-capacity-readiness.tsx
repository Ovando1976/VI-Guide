import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ShipWheel,
} from "lucide-react";

import { getSession } from "@/lib/auth-server";
import {
  OFFICIAL_CRUISE_SCHEDULE_COVERAGE,
  OFFICIAL_USVI_CRUISE_PORT_CALLS,
} from "@/lib/cruise-port-calls";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type { ProviderAvailabilityDay } from "@/types/provider-operations";

const MAX_PROFILES = 100;
const MAX_CALLS_PER_PROFILE = 6;

export async function ShoreExcursionCapacityReadiness() {
  const session = await getSession();
  if (!session || !["merchant", "dispatcher", "admin"].includes(session.role)) {
    return null;
  }
  if (!hasFirebaseAdminConfiguration()) return null;

  const db = getAdminDb();
  const profileSnapshot = await db.collection("shoreExcursions").limit(MAX_PROFILES).get();
  const allowedListingIds = new Set(session.role === "merchant" ? session.listingIds ?? [] : []);

  const profiles = profileSnapshot.docs
    .map((document) => {
      const data = document.data();
      return {
        offerId: document.id,
        listingId: clean(data.listingId, 160),
        listingName: clean(data.listingName, 180),
        offerTitle: clean(data.offerTitle, 120),
        status: clean(data.status, 30),
        supportedPorts: Array.isArray(data.supportedPorts)
          ? data.supportedPorts.filter((value): value is string => typeof value === "string")
          : [],
      };
    })
    .filter(
      (profile) =>
        profile.listingId &&
        profile.offerTitle &&
        profile.status !== "archived" &&
        (session.role !== "merchant" || allowedListingIds.has(profile.listingId)),
    );

  if (!profiles.length) return null;

  const listingIds = Array.from(new Set(profiles.map((profile) => profile.listingId)));
  const operationsDocuments = await Promise.all(
    listingIds.map((listingId) => db.collection("providerOperations").doc(listingId).get()),
  );
  const operationsByListingId = new Map(
    operationsDocuments.map((document) => [document.id, document.data() ?? null] as const),
  );

  const today = usviDateString();
  const upcomingCalls = OFFICIAL_USVI_CRUISE_PORT_CALLS.filter(
    (call) => call.status === "scheduled" && call.date >= today,
  );

  const readiness = profiles
    .map((profile) => {
      const calls = upcomingCalls.filter((call) => profile.supportedPorts.includes(call.portId));
      const days = providerDays(operationsByListingId.get(profile.listingId));
      const dayByDate = new Map(days.map((day) => [day.date, day]));
      const callRows = calls.map((call) => {
        const day = dayByDate.get(call.date) ?? null;
        return {
          call,
          day,
          state: readinessState(day),
        };
      });
      return {
        ...profile,
        calls: callRows,
        publishedCount: callRows.filter((row) => row.state === "published").length,
        missingCount: callRows.filter((row) => row.state === "missing").length,
        closedCount: callRows.filter((row) => row.state === "closed").length,
      };
    })
    .filter((profile) => profile.calls.length > 0)
    .sort((a, b) => b.missingCount - a.missingCount || a.offerTitle.localeCompare(b.offerTitle));

  if (!readiness.length) return null;

  const totalCalls = readiness.reduce((sum, profile) => sum + profile.calls.length, 0);
  const totalPublished = readiness.reduce((sum, profile) => sum + profile.publishedCount, 0);
  const totalMissing = readiness.reduce((sum, profile) => sum + profile.missingCount, 0);

  return (
    <section className="bg-[#f8f4ea] px-4 pt-5 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              <CalendarCheck2 className="h-4 w-4" /> Upcoming cruise-call readiness
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
              See exactly which ship dates still need capacity.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              This compares each cruise-ready offer with VI Guide&apos;s loaded official port-call window and your business availability calendar. A published date means the business is open and has positive capacity; final traveler availability still rechecks ship timing and live demand.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Calls" value={totalCalls} />
            <Metric label="Published" value={totalPublished} />
            <Metric label="Missing" value={totalMissing} attention={totalMissing > 0} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {readiness.map((profile) => (
            <article
              key={profile.offerId}
              className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-teal-800">
                      {profile.status || "draft"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">
                      {profile.listingName || profile.listingId}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-black tracking-[-.03em] text-[#043331]">
                    {profile.offerTitle}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {profile.publishedCount} published · {profile.missingCount} missing · {profile.closedCount} closed/zero capacity
                  </p>
                </div>
                <Link
                  href={`/merchant/availability?listingId=${encodeURIComponent(profile.listingId)}`}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[8px] font-black uppercase tracking-[.13em] text-white"
                >
                  <CalendarClock className="h-4 w-4 text-[#f5c451]" /> Fix availability
                </Link>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {profile.calls.slice(0, MAX_CALLS_PER_PROFILE).map(({ call, day, state }) => (
                  <div
                    key={call.id}
                    className={`rounded-2xl border p-3 ${
                      state === "published"
                        ? "border-emerald-200 bg-emerald-50"
                        : state === "closed"
                          ? "border-amber-200 bg-amber-50"
                          : "border-rose-200 bg-rose-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[#043331]">{call.shipName}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-600">
                          {formatDate(call.date)} · {call.terminalLabel}
                        </p>
                      </div>
                      {state === "published" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                      ) : (
                        <AlertTriangle className={`h-4 w-4 shrink-0 ${state === "closed" ? "text-amber-700" : "text-rose-700"}`} />
                      )}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.11em] text-slate-600">
                      <Clock3 className="h-3.5 w-3.5" />
                      {state === "published" && day
                        ? `${day.startTime}–${day.endTime} · ${day.capacity} guests`
                        : state === "closed"
                          ? "Date exists but is closed or has zero capacity"
                          : "No dated availability record"}
                    </p>
                  </div>
                ))}
              </div>

              {profile.calls.length > MAX_CALLS_PER_PROFILE ? (
                <p className="mt-3 text-[10px] font-bold text-slate-500">
                  +{profile.calls.length - MAX_CALLS_PER_PROFILE} more official calls in the loaded schedule window.
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] font-semibold text-slate-500">
          <ShipWheel className="h-4 w-4 text-teal-700" />
          Official schedule coverage currently loaded: {formatDate(OFFICIAL_CRUISE_SCHEDULE_COVERAGE.from)} through {formatDate(OFFICIAL_CRUISE_SCHEDULE_COVERAGE.through)}.
        </p>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div className={`min-w-20 rounded-2xl border px-3 py-3 ${attention ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-lg font-black ${attention ? "text-rose-700" : "text-[#043331]"}`}>{value}</p>
      <p className="mt-1 text-[7px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p>
    </div>
  );
}

function providerDays(data: FirebaseFirestore.DocumentData | null | undefined) {
  if (!data || !Array.isArray(data.days)) return [] as ProviderAvailabilityDay[];
  return data.days.flatMap((value: unknown) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const day = value as Partial<ProviderAvailabilityDay>;
    if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) return [];
    return [
      {
        date: day.date,
        isOpen: day.isOpen === true,
        capacity: whole(day.capacity),
        startTime: validTime(day.startTime) ? day.startTime : "09:00",
        endTime: validTime(day.endTime) ? day.endTime : "17:00",
        ...(typeof day.note === "string" && day.note.trim() ? { note: day.note.trim() } : {}),
      },
    ];
  });
}

function readinessState(day: ProviderAvailabilityDay | null) {
  if (!day) return "missing" as const;
  if (!day.isOpen || day.capacity <= 0) return "closed" as const;
  return "published" as const;
}

function whole(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0;
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function usviDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
