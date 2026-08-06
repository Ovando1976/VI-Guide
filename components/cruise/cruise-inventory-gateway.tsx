"use client";

import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Search,
  ShipWheel,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import type {
  CruiseInventoryCapabilities,
  CruiseInventoryProviderId,
  CruiseInventoryStage,
  CruiseSailing,
} from "@/lib/cruise-inventory/types";

type InventoryStatus = {
  provider: CruiseInventoryProviderId;
  stage: CruiseInventoryStage;
  enabled: boolean;
  live: boolean;
  capabilities: CruiseInventoryCapabilities;
  nextAction: string;
};

type StatusResponse = {
  ok?: boolean;
  inventory?: InventoryStatus;
};

type SearchResponse = {
  ok?: boolean;
  live?: boolean;
  results?: CruiseSailing[];
  error?: string;
  code?: string;
};

export function CruiseInventoryGateway() {
  const [status, setStatus] = useState<InventoryStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<CruiseSailing[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cruises/inventory/status", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | StatusResponse
          | null;
        if (!response.ok || !payload?.inventory) {
          throw new Error("Unable to load cruise inventory status.");
        }
        if (!cancelled) setStatus(payload.inventory);
      })
      .catch((error) => {
        if (!cancelled) {
          setStatusError(
            error instanceof Error
              ? error.message
              : "Unable to load cruise inventory status.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultDates = useMemo(() => {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 60);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 90);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }, []);

  async function searchInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setSearchError(null);
    setResults([]);

    const data = new FormData(event.currentTarget);
    const adults = Number(data.get("adults") || 2);
    const children = Number(data.get("children") || 0);
    const destination = String(data.get("destination") || "").trim();
    const departurePort = String(data.get("departurePort") || "").trim();

    try {
      const response = await fetch("/api/cruises/inventory/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureDateFrom: data.get("departureDateFrom"),
          departureDateTo: data.get("departureDateTo"),
          departurePortIds: departurePort ? [departurePort] : [],
          destinationNames: destination ? [destination] : [],
          adults,
          childAges: Array.from({ length: children }, () => 8),
          currency: "USD",
          limit: 24,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | SearchResponse
        | null;
      if (!response.ok || !payload?.results) {
        throw new Error(payload?.error || "Unable to search cruise inventory.");
      }
      setResults(payload.results);
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "Unable to search cruise inventory.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="px-4 pb-2 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-teal-700">
              Live inventory connection
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#043331] sm:text-4xl">
              Search, cabin pricing, and booking are being connected as one governed system.
            </h2>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
              VI Guide now has a provider-neutral inventory contract. Real cruise
              results will only be labeled live after the selected supplier,
              agency credentials, payment responsibilities, and production
              certification are approved.
            </p>
          </div>

          <div className="min-w-[250px] rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            {loadingStatus ? (
              <div className="flex items-center gap-3 text-sm font-black text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
                Checking connection
              </div>
            ) : statusError ? (
              <div className="flex items-start gap-3 text-sm font-bold text-rose-700">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                {statusError}
              </div>
            ) : status ? (
              <>
                <div className="flex items-center gap-2">
                  {status.live ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <ShipWheel className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="text-sm font-black text-[#043331]">
                    {status.live
                      ? "Live supplier inventory"
                      : status.enabled
                        ? "Integration sandbox"
                        : "Commercial access pending"}
                  </span>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                  Provider: {humanize(status.provider)}
                  <br />
                  Stage: {humanize(status.stage)}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {status?.enabled && status.capabilities.search ? (
          <div className="mt-7 border-t border-slate-200 pt-7">
            <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-950/75">
              {status.live
                ? "Prices and availability are being returned by the contracted supplier. Repricing is still required before booking."
                : "Development inventory only. These results are synthetic and cannot reserve or purchase a cruise."}
            </div>

            <form
              onSubmit={searchInventory}
              className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6"
            >
              <Field label="From" icon={CalendarRange}>
                <input
                  name="departureDateFrom"
                  type="date"
                  required
                  defaultValue={defaultDates.start}
                  className={inputClass}
                />
              </Field>
              <Field label="To" icon={CalendarRange}>
                <input
                  name="departureDateTo"
                  type="date"
                  required
                  defaultValue={defaultDates.end}
                  className={inputClass}
                />
              </Field>
              <Field label="Departure port">
                <select name="departurePort" defaultValue="" className={inputClass}>
                  <option value="">Any port</option>
                  <option value="MIA">Miami</option>
                  <option value="SJU">San Juan</option>
                </select>
              </Field>
              <Field label="Destination">
                <select name="destination" defaultValue="" className={inputClass}>
                  <option value="">Any destination</option>
                  <option value="U.S. Virgin Islands">U.S. Virgin Islands</option>
                  <option value="Eastern Caribbean">Eastern Caribbean</option>
                  <option value="Southern Caribbean">Southern Caribbean</option>
                  <option value="Bahamas">Bahamas</option>
                </select>
              </Field>
              <Field label="Adults" icon={UsersRound}>
                <input
                  name="adults"
                  type="number"
                  min={1}
                  max={8}
                  defaultValue={2}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Children">
                <input
                  name="children"
                  type="number"
                  min={0}
                  max={8}
                  defaultValue={0}
                  required
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                disabled={searching}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60 md:col-span-2 xl:col-span-6"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search connected inventory
              </button>
            </form>

            {searchError ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {searchError}
              </div>
            ) : null}

            {results.length ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {results.map((sailing) => (
                  <SailingCard key={sailing.id} sailing={sailing} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-7 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-[#043331]">
              The advisor request service remains available while inventory access is completed.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {status?.nextAction ||
                "The supplier connection is being prepared. Cruise prices shown elsewhere in VI Guide must not be treated as live inventory."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function SailingCard({ sailing }: { sailing: CruiseSailing }) {
  return (
    <article className="rounded-[24px] border border-slate-200 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.13em] text-teal-700">
          {sailing.liveVerified ? "Live verified" : "Development inventory"}
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          Checked {formatDateTime(sailing.lastVerifiedAt)}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-black tracking-[-.035em] text-[#043331]">
        {sailing.ship.name}
      </h3>
      <p className="mt-1 text-sm font-bold text-slate-500">
        {sailing.cruiseLine.name} · {sailing.nights} nights
      </p>
      <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
        {formatDate(sailing.departureDate)} from {sailing.departurePort.name}
        <br />
        {sailing.destinationNames.join(" · ")}
      </p>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Starting fare
          </p>
          <p className="mt-1 text-xl font-black text-[#043331]">
            {sailing.leadFare
              ? formatMoney(
                  sailing.leadFare.amount.amountCents,
                  sailing.leadFare.amount.currency,
                )
              : "Request quote"}
          </p>
        </div>
        <p className="text-right text-[10px] font-bold leading-5 text-slate-400">
          Reprice before hold
          <br />
          or booking
        </p>
      </div>
    </article>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof CalendarRange;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-black text-[#043331]">
      <span className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-teal-700" /> : null}
        {label}
      </span>
      {children}
    </label>
  );
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(value: string) {
  const parsed = Date.parse(`${value}T12:00:00.000Z`);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/St_Thomas",
      }).format(parsed)
    : value;
}

function formatDateTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/St_Thomas",
      }).format(parsed)
    : value;
}

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#043331] outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100";
