"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query } from "firebase/firestore";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  MapPin,
  MoreVertical,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { AdminShell } from "@/components/admin-shell";
import {
  OpsCard,
  OpsMetric,
  OpsPill,
  OpsSection,
} from "@/components/ops/ops-ui";

type DriverRow = {
  id: string;
  idHint?: string;
  displayName?: string;
  availability?: "available" | "busy" | "offline";
  islands?: string[];
  reliabilityScore?: number;
  verified?: boolean;
  authorizationStatus?: string;
  associationId?: string;
  vehicleId?: string;
  updatedAt?: { seconds?: number; nanoseconds?: number } | string;
};

const STATUS_FILTERS = ["all", "available", "busy", "offline"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function DriverRosterBoard() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [islandFilter, setIslandFilter] = useState("all");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "drivers")),
      (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DriverRow[];

        setDrivers(
          rows
            .filter((driver) => driver.displayName || driver.idHint)
            .sort(
              (a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0)
            )
        );
        setErrorMessage(null);
      },
      (error) => {
        console.error("driver roster listener error", error);
        setErrorMessage(error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const metrics = useMemo(() => {
    const total = drivers.length;
    const available = drivers.filter(
      (driver) => driver.availability === "available"
    ).length;
    const busy = drivers.filter((driver) => driver.availability === "busy").length;
    const offline = drivers.filter(
      (driver) => driver.availability === "offline"
    ).length;

    const avgReliability =
      total > 0
        ? drivers.reduce(
            (sum, driver) => sum + (driver.reliabilityScore ?? 0),
            0
          ) / total
        : 0;

    return {
      total,
      available,
      busy,
      offline,
      avgReliability,
    };
  }, [drivers]);

  const uniqueIslands = useMemo(() => {
    const islands = new Set<string>();

    drivers.forEach((driver) => {
      driver.islands?.forEach((island) => islands.add(normalizeIslandLabel(island)));
    });

    return Array.from(islands).sort();
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const normalizedSearch = searchQuery.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        driver.displayName?.toLowerCase().includes(normalizedSearch) ||
        driver.idHint?.toLowerCase().includes(normalizedSearch) ||
        driver.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || driver.availability === statusFilter;

      const normalizedDriverIslands = (driver.islands || []).map((island) =>
        normalizeIslandLabel(island)
      );

      const matchesIsland =
        islandFilter === "all" || normalizedDriverIslands.includes(islandFilter);

      return matchesSearch && matchesStatus && matchesIsland;
    });
  }, [drivers, islandFilter, searchQuery, statusFilter]);

  return (
    <AdminShell
      eyebrow="Fleet OS"
      title="Driver roster"
      description="Reviewed taxi credentials, association membership, fleet coverage, availability, and reliability."
      actions={
        <>
          <Link
            href="/admin/dispatch"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#043331]"
          >
            Open dispatch
          </Link>
          <Link
            href="/admin/taxi-operations"
            className="rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            Onboard operator
          </Link>
        </>
      }
    >
      <div className="space-y-8">
        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <OpsMetric
            label="Total Fleet"
            value={String(metrics.total)}
            footnote="registered drivers"
          />
          <OpsMetric
            label="Available"
            value={String(metrics.available)}
            tone="success"
            footnote="ready to assign"
          />
          <OpsMetric
            label="Busy"
            value={String(metrics.busy)}
            tone="warning"
            footnote="active trips"
          />
          <OpsMetric
            label="Offline"
            value={String(metrics.offline)}
            footnote="not accepting work"
          />
          <OpsMetric
            label="Avg Reliability"
            value={`${metrics.avgReliability.toFixed(1)}%`}
            footnote="fleet quality"
          />
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <OpsSection
            eyebrow="Roster"
            title="Driver directory"
            subtitle="Search, filter, and review driver coverage across the islands."
            actions={
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                {filteredDrivers.length} shown
              </div>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_0.5fr]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search driver, ID, or record..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#043331]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#043331]"
                >
                  <option value="all">All statuses</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>

                <select
                  value={islandFilter}
                  onChange={(e) => setIslandFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none transition focus:border-[#043331]"
                >
                  <option value="all">All islands</option>
                  {uniqueIslands.map((island) => (
                    <option key={island} value={island}>
                      {island}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {filteredDrivers.length ? (
                  filteredDrivers.map((driver) => (
                    <DriverRosterCard key={driver.id} driver={driver} />
                  ))
                ) : (
                  <EmptyRosterState hasDrivers={drivers.length > 0} />
                )}
              </div>
            </div>
          </OpsSection>

          <div className="space-y-8">
            <OpsSection
              eyebrow="Operations"
              title="Quick actions"
              subtitle="High-priority fleet management actions."
            >
              <div className="space-y-3">
                <Link href="/admin/taxi-operations" className="block">
                  <ActionCard
                    icon={Plus}
                    title="Onboard reviewed operator"
                    description="Record association, Commission credential, license, and fleet vehicle together."
                    tone="teal"
                  />
                </Link>
                <Link
                  href="/admin/dispatch"
                  className="block rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4 transition hover:border-[#f5b942] hover:bg-[#fff4d6]"
                >
                  <div className="text-lg font-black italic tracking-tight text-[#043331]">
                    Open dispatch board
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-600">
                    Move from roster oversight into live trip assignment.
                  </div>
                </Link>
              </div>
            </OpsSection>

            <OpsSection
              eyebrow="Live activity"
              title="Fleet signal"
              subtitle="A high-level feed of operator state changes."
            >
              <div className="space-y-4">
                <TimelineItem
                  icon={CheckCircle2}
                  title="Driver completed territory trip"
                  description="Recent successful completion recorded in the fleet."
                  tone="emerald"
                />
                <TimelineItem
                  icon={Activity}
                  title="Driver moved to available"
                  description="Operator is now visible for new dispatch."
                  tone="sky"
                />
                <TimelineItem
                  icon={XCircle}
                  title="Driver went offline"
                  description="Operator is no longer accepting new work."
                  tone="slate"
                />
              </div>
            </OpsSection>

            <OpsSection
              eyebrow="Coverage"
              title="Island footprint"
              subtitle="Where the fleet is currently configured to operate."
            >
              <div className="flex flex-wrap gap-2">
                {uniqueIslands.length ? (
                  uniqueIslands.map((island) => (
                    <OpsPill key={island} label={island} />
                  ))
                ) : (
                  <div className="text-sm font-semibold text-slate-500">
                    No island coverage assigned yet.
                  </div>
                )}
              </div>
            </OpsSection>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function DriverRosterCard({ driver }: { driver: DriverRow }) {
  const reliability = Math.max(0, Math.min(100, driver.reliabilityScore ?? 0));
  const coverage = (driver.islands || []).map((island) =>
    normalizeIslandLabel(island)
  );

  return (
    <OpsCard>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f3f1] text-base font-black text-[#043331]">
            {(driver.displayName || driver.idHint || "D").charAt(0)}
          </div>

          <div className="min-w-0">
            <div className="truncate text-lg font-black tracking-tight text-[#043331]">
              {driver.displayName || "Unknown Driver"}
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              {driver.idHint || driver.id}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={driver.availability} />
          <OpsPill
            label={
              driver.verified && driver.authorizationStatus === "active" && driver.associationId && driver.vehicleId
                ? "Credentialed"
                : "Review required"
            }
            tone={
              driver.verified && driver.authorizationStatus === "active" && driver.associationId && driver.vehicleId
                ? "emerald"
                : "amber"
            }
          />
          {coverage.length ? (
            coverage.map((island) => <OpsPill key={island} label={island} />)
          ) : (
            <OpsPill label="UNASSIGNED" />
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            Reliability
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  reliability >= 95
                    ? "bg-emerald-500"
                    : reliability >= 80
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${reliability}%` }}
              />
            </div>
            <div className="w-14 text-right text-sm font-black text-[#043331]">
              {reliability}%
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label={`More actions for ${driver.displayName || driver.idHint || driver.id}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </OpsCard>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  tone,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "teal" | "slate";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const toneClass =
    tone === "teal"
      ? "border-[#0f766e]/20 bg-[#e8f3f1] hover:bg-[#dff1ee]"
      : "border-slate-200 bg-slate-50 hover:bg-slate-100";

  const content = (
    <div
      className={`rounded-[24px] border p-4 transition ${toneClass} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/80 p-3">
          <Icon className="h-5 w-5 text-[#043331]" />
        </div>
        <div>
          <div className="text-base font-black text-[#043331]">{title}</div>
          <div className="mt-1 text-sm font-semibold text-slate-600">
            {description}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="block w-full text-left"
      >
        {content}
      </button>
    );
  }

  return content;
}

function TimelineItem({
  icon: Icon,
  title,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: "emerald" | "sky" | "slate";
}) {
  const iconTone =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-600"
      : tone === "sky"
        ? "bg-sky-100 text-sky-600"
        : "bg-slate-100 text-slate-500";

  return (
    <div className="flex gap-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-black text-[#043331]">{title}</div>
        <div className="mt-1 text-sm font-semibold text-slate-500">
          {description}
        </div>
      </div>
    </div>
  );
}

function EmptyRosterState({
  hasDrivers,
}: {
  hasDrivers: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Search className="h-6 w-6 text-slate-400" />
      </div>

      <div className="mt-4 text-lg font-black text-[#043331]">
        {hasDrivers ? "No drivers match these filters" : "No drivers yet"}
      </div>

      <div className="mt-2 text-sm font-semibold text-slate-500">
        {hasDrivers
          ? "Try changing the search, status, or island filters."
          : "Onboard a reviewed, licensed association operator to begin dispatch."}
      </div>

      {!hasDrivers ? (
        <Link
          href="/admin/taxi-operations"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Onboard operator
        </Link>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Available
      </span>
    );
  }

  if (status === "busy") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Busy
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
      <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Offline
    </span>
  );
}

function normalizeIslandLabel(value: string) {
  const key = value.trim().toLowerCase();

  if (key === "stt" || key === "st. thomas" || key === "st thomas" || key === "saint thomas") {
    return "STT";
  }

  if (key === "stj" || key === "st. john" || key === "st john" || key === "saint john") {
    return "STJ";
  }

  if (key === "stx" || key === "st. croix" || key === "st croix" || key === "saint croix") {
    return "STX";
  }

  if (key === "water island") {
    return "WATER ISLAND";
  }

  return value.toUpperCase();
}
