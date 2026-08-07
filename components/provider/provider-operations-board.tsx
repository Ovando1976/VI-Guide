"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Loader2,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  buildProviderAvailabilityDays,
  humanizeListingId,
  resolveMerchantListingSelection,
} from "@/lib/merchant-portal";
import type {
  ProviderAvailabilityDay,
  ProviderOperationsConfig,
} from "@/types/provider-operations";

type ProviderOperationsBoardProps = {
  initialListingId?: string;
  initialFocusDate?: string;
  managedListingIds?: string[];
  restrictToManagedListings?: boolean;
};

export function ProviderOperationsBoard({
  initialListingId,
  initialFocusDate = "",
  managedListingIds = [],
  restrictToManagedListings = false,
}: ProviderOperationsBoardProps) {
  const normalizedManagedListingIds = useMemo(
    () =>
      Array.from(
        new Set(
          managedListingIds
            .map((listingId) => listingId.trim().slice(0, 160))
            .filter(Boolean),
        ),
      ),
    [managedListingIds],
  );
  const resolvedInitialListingId = useMemo(
    () =>
      resolveMerchantListingSelection({
        requestedListingId: initialListingId,
        managedListingIds: normalizedManagedListingIds,
        restricted: restrictToManagedListings,
      }),
    [
      initialListingId,
      normalizedManagedListingIds,
      restrictToManagedListings,
    ],
  );
  const normalizedInitialFocusDate = useMemo(
    () =>
      /^\d{4}-\d{2}-\d{2}$/.test(initialFocusDate)
        ? initialFocusDate
        : "",
    [initialFocusDate],
  );
  const lastAutoLoadedListingId = useRef("");
  const lastFocusedDateKey = useRef("");
  const activeLoadRequest = useRef(0);
  const [listingId, setListingId] = useState(resolvedInitialListingId);
  const [listingName, setListingName] = useState(
    resolvedInitialListingId ? humanizeListingId(resolvedInitialListingId) : "",
  );
  const [defaultCapacity, setDefaultCapacity] = useState(10);
  const [days, setDays] = useState<ProviderAvailabilityDay[]>(() =>
    resolvedInitialListingId || !restrictToManagedListings
      ? buildProviderAvailabilityDays(10)
      : [],
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listingIsAllowed = useCallback(
    (candidate: string) =>
      !restrictToManagedListings ||
      normalizedManagedListingIds.includes(candidate),
    [normalizedManagedListingIds, restrictToManagedListings],
  );

  const loadProviderById = useCallback(
    async (targetListingId: string, silent = false) => {
      const normalizedListingId = targetListingId.trim().slice(0, 160);
      if (!normalizedListingId) return;
      if (!listingIsAllowed(normalizedListingId)) {
        setError("This business is not assigned to your merchant account.");
        return;
      }

      const requestId = activeLoadRequest.current + 1;
      activeLoadRequest.current = requestId;
      if (!silent) setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(
          `/api/provider-operations?listingId=${encodeURIComponent(normalizedListingId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | { config?: ProviderOperationsConfig | null; error?: string }
          | null;
        if (!response.ok) {
          throw new Error(
            payload?.error || "Unable to load provider operations.",
          );
        }
        if (activeLoadRequest.current !== requestId) return;

        setListingId(normalizedListingId);
        if (payload?.config) {
          setListingName(payload.config.listingName);
          setDefaultCapacity(payload.config.defaultCapacity);
          setDays(
            payload.config.days.length
              ? payload.config.days
              : buildProviderAvailabilityDays(payload.config.defaultCapacity),
          );
          setMessage("Provider operations loaded.");
        } else {
          setListingName(humanizeListingId(normalizedListingId));
          setDefaultCapacity(10);
          setDays(buildProviderAvailabilityDays(10));
          setMessage(
            "No saved operations found. Set availability and save this business.",
          );
        }
      } catch (caught) {
        if (activeLoadRequest.current !== requestId) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load provider operations.",
        );
      } finally {
        if (!silent && activeLoadRequest.current === requestId) {
          setLoading(false);
        }
      }
    },
    [listingIsAllowed],
  );

  useEffect(() => {
    if (
      !resolvedInitialListingId ||
      lastAutoLoadedListingId.current === resolvedInitialListingId
    ) {
      return;
    }
    lastAutoLoadedListingId.current = resolvedInitialListingId;
    void loadProviderById(resolvedInitialListingId, true);
  }, [loadProviderById, resolvedInitialListingId]);

  const focusDateIsVisible = Boolean(
    normalizedInitialFocusDate &&
      listingId === resolvedInitialListingId &&
      days.some((day) => day.date === normalizedInitialFocusDate),
  );

  useEffect(() => {
    if (!focusDateIsVisible) return;
    const focusKey = `${listingId}:${normalizedInitialFocusDate}`;
    if (lastFocusedDateKey.current === focusKey) return;
    lastFocusedDateKey.current = focusKey;

    const timer = window.setTimeout(() => {
      document
        .getElementById(`provider-day-${normalizedInitialFocusDate}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [focusDateIsVisible, listingId, normalizedInitialFocusDate]);

  const summary = useMemo(() => {
    const openDays = days.filter((day) => day.isOpen);
    return {
      openDays: openDays.length,
      totalCapacity: openDays.reduce((sum, day) => sum + day.capacity, 0),
      blackoutDays: days.length - openDays.length,
    };
  }, [days]);

  async function loadProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listingId.trim()) return;
    await loadProviderById(listingId, false);
  }

  async function saveProvider() {
    const normalizedListingId = listingId.trim().slice(0, 160);
    if (!normalizedListingId || !listingName.trim()) {
      setError("Choose a business and enter its provider name before saving.");
      return;
    }
    if (!listingIsAllowed(normalizedListingId)) {
      setError("This business is not assigned to your merchant account.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/provider-operations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: normalizedListingId,
          listingName: listingName.trim(),
          timezone: "America/St_Thomas",
          defaultCapacity,
          days,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { config?: ProviderOperationsConfig; error?: string }
        | null;
      if (!response.ok || !payload?.config) {
        throw new Error(
          payload?.error || "Unable to save provider operations.",
        );
      }
      setMessage("Provider availability and capacity saved.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save provider operations.",
      );
    } finally {
      setSaving(false);
    }
  }

  function chooseListing(nextListingId: string) {
    const normalizedListingId = nextListingId.trim().slice(0, 160);
    setListingId(normalizedListingId);
    setListingName(
      normalizedListingId ? humanizeListingId(normalizedListingId) : "",
    );
    setDefaultCapacity(10);
    setDays(
      normalizedListingId ? buildProviderAvailabilityDays(10) : [],
    );
    setMessage(null);
    setError(null);
    if (normalizedListingId) {
      void loadProviderById(normalizedListingId, false);
    }
  }

  function updateDay(index: number, patch: Partial<ProviderAvailabilityDay>) {
    setDays((current) =>
      current.map((day, currentIndex) =>
        currentIndex === index ? { ...day, ...patch } : day,
      ),
    );
  }

  const merchantHasNoScope =
    restrictToManagedListings && !normalizedManagedListingIds.length;

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/merchant"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.14em]"
        >
          <ArrowLeft className="h-4 w-4" /> Business console
        </Link>

        <section className="mt-4 rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Provider Operations
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Availability & Capacity
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Set operating days, hours, capacity, and blackout periods for
                each participating business.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveProvider()}
              disabled={saving || merchantHasNoScope || !listingId}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save operations
            </button>
          </div>
        </section>

        {restrictToManagedListings ? (
          <section className="mt-6 rounded-[26px] border border-teal-200 bg-teal-50 p-5">
            <div className="flex gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
                  Merchant listing scope
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-teal-950/70">
                  Only businesses assigned to your signed merchant account are
                  available here. Server authorization enforces the same scope.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {merchantHasNoScope ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            No businesses are assigned to this merchant account. Ask an
            administrator to add listing access.
          </div>
        ) : null}

        <form
          onSubmit={loadProvider}
          className="mt-6 grid gap-3 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_1fr_160px_140px]"
        >
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Business listing
            {restrictToManagedListings ? (
              <select
                required
                disabled={merchantHasNoScope}
                value={listingId}
                onChange={(event) => chooseListing(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
              >
                {!normalizedManagedListingIds.length ? (
                  <option value="">No assigned listings</option>
                ) : null}
                {normalizedManagedListingIds.map((managedListingId) => (
                  <option key={managedListingId} value={managedListingId}>
                    {humanizeListingId(managedListingId)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                value={listingId}
                onChange={(event) => setListingId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
                placeholder="provider-listing-id"
              />
            )}
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Provider name
            <input
              required
              disabled={merchantHasNoScope}
              value={listingName}
              onChange={(event) => setListingName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
              placeholder="Island operator"
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Default capacity
            <input
              type="number"
              min={1}
              max={500}
              disabled={merchantHasNoScope}
              value={defaultCapacity}
              onChange={(event) =>
                setDefaultCapacity(Number(event.target.value) || 1)
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading || merchantHasNoScope || !listingId}
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh business"
            )}
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}
        {focusDateIsVisible ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-950">
            Cruise capacity action: review {normalizedInitialFocusDate}, set the operating decision for this date, then save operations.
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={CalendarDays}
            label="Open days"
            value={String(summary.openDays)}
          />
          <Metric
            icon={Users}
            label="Total capacity"
            value={String(summary.totalCapacity)}
          />
          <Metric
            icon={ShieldCheck}
            label="Blackout days"
            value={String(summary.blackoutDays)}
          />
        </section>

        <section className="mt-6 space-y-3">
          {days.map((day, index) => {
            const focused =
              focusDateIsVisible && day.date === normalizedInitialFocusDate;
            return (
              <article
                id={`provider-day-${day.date}`}
                key={day.date}
                className={`scroll-mt-24 grid gap-3 rounded-[28px] border bg-white p-5 shadow-sm md:grid-cols-[150px_110px_120px_120px_130px_1fr] md:items-end ${
                  focused
                    ? "border-amber-400 ring-4 ring-amber-200/60"
                    : "border-slate-200"
                }`}
              >
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    {focused ? "Cruise date" : "Date"}
                  </p>
                  <p className="mt-2 text-sm font-black">{day.date}</p>
                </div>
                <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                  Open
                  <button
                    type="button"
                    disabled={merchantHasNoScope}
                    onClick={() => updateDay(index, { isOpen: !day.isOpen })}
                    className={`mt-2 min-h-11 w-full rounded-2xl text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50 ${
                      day.isOpen
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {day.isOpen ? "Open" : "Closed"}
                  </button>
                </label>
                <Field
                  label="Start"
                  value={day.startTime}
                  type="time"
                  disabled={merchantHasNoScope}
                  onChange={(value) => updateDay(index, { startTime: value })}
                />
                <Field
                  label="End"
                  value={day.endTime}
                  type="time"
                  disabled={merchantHasNoScope}
                  onChange={(value) => updateDay(index, { endTime: value })}
                />
                <Field
                  label="Capacity"
                  value={String(day.capacity)}
                  type="number"
                  disabled={merchantHasNoScope}
                  onChange={(value) =>
                    updateDay(index, { capacity: Number(value) || 0 })
                  }
                />
                <Field
                  label="Operations note"
                  value={day.note ?? ""}
                  disabled={merchantHasNoScope}
                  onChange={(value) => updateDay(index, { note: value })}
                  placeholder="Weather, staffing, pickup window..."
                />
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
      {label}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
      />
    </label>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
    </div>
  );
}
