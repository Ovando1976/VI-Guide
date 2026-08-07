"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarRange,
  Clock3,
  Loader2,
  Save,
  ShieldCheck,
  ShipWheel,
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
  applyProviderAvailabilityWindowDecision,
  buildProviderAvailabilityDays,
  humanizeListingId,
  resolveMerchantListingSelection,
  selectProviderAvailabilityDecisions,
} from "@/lib/merchant-portal";
import type { ProviderCruiseDemandDate } from "@/lib/provider-cruise-demand";
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

type CruiseScheduleCoverage = {
  from: string;
  through: string;
};

type ProviderOperationsPayload = {
  config?: ProviderOperationsConfig | null;
  persistedDates?: string[];
  cruiseDemandDates?: ProviderCruiseDemandDate[];
  cruiseScheduleCoverage?: CruiseScheduleCoverage;
  error?: string;
};

const BULK_WINDOW_OPTIONS = [7, 14, 30, 90] as const;

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
  const [loadedListingId, setLoadedListingId] = useState("");
  const [listingName, setListingName] = useState(
    resolvedInitialListingId ? humanizeListingId(resolvedInitialListingId) : "",
  );
  const [defaultCapacity, setDefaultCapacity] = useState(10);
  const [days, setDays] = useState<ProviderAvailabilityDay[]>(() =>
    resolvedInitialListingId || !restrictToManagedListings
      ? buildProviderAvailabilityDays(10)
      : [],
  );
  const [decisionDates, setDecisionDates] = useState<Set<string>>(
    () => new Set(),
  );
  const [cruiseDemandDates, setCruiseDemandDates] = useState<
    ProviderCruiseDemandDate[]
  >([]);
  const [cruiseScheduleCoverage, setCruiseScheduleCoverage] =
    useState<CruiseScheduleCoverage | null>(null);
  const [bulkWindowDays, setBulkWindowDays] = useState<number>(14);
  const [bulkStartTime, setBulkStartTime] = useState("09:00");
  const [bulkEndTime, setBulkEndTime] = useState("17:00");
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
      setLoadedListingId("");
      setCruiseDemandDates([]);
      setCruiseScheduleCoverage(null);
      if (!silent) setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(
          `/api/provider-operations?listingId=${encodeURIComponent(normalizedListingId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => null)) as
          | ProviderOperationsPayload
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
          setDecisionDates(toDateSet(payload.persistedDates));
          setMessage("Provider operations loaded.");
        } else {
          setListingName(humanizeListingId(normalizedListingId));
          setDefaultCapacity(10);
          setDays(buildProviderAvailabilityDays(10));
          setDecisionDates(new Set());
          setMessage(
            "No saved operations found. Set availability and save this business.",
          );
        }
        setCruiseDemandDates(
          Array.isArray(payload?.cruiseDemandDates)
            ? payload.cruiseDemandDates
            : [],
        );
        setCruiseScheduleCoverage(
          validCoverage(payload?.cruiseScheduleCoverage)
            ? payload!.cruiseScheduleCoverage!
            : null,
        );
        setLoadedListingId(normalizedListingId);
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

  const operationsReady = Boolean(
    listingId && loadedListingId && loadedListingId === listingId,
  );
  const merchantHasNoScope =
    restrictToManagedListings && !normalizedManagedListingIds.length;
  const editorDisabled = merchantHasNoScope || !operationsReady;
  const focusDateIsVisible = Boolean(
    normalizedInitialFocusDate &&
      listingId === resolvedInitialListingId &&
      days.some((day) => day.date === normalizedInitialFocusDate),
  );

  const cruiseDemandByDate = useMemo(
    () => new Map(cruiseDemandDates.map((demand) => [demand.date, demand])),
    [cruiseDemandDates],
  );
  const cruiseDemandTargetDates = useMemo(
    () => new Set(cruiseDemandDates.map((demand) => demand.date)),
    [cruiseDemandDates],
  );
  const focusCruiseDemand = normalizedInitialFocusDate
    ? cruiseDemandByDate.get(normalizedInitialFocusDate) ?? null
    : null;

  useEffect(() => {
    if (!focusDateIsVisible || !operationsReady) return;
    const focusKey = `${listingId}:${normalizedInitialFocusDate}`;
    if (lastFocusedDateKey.current === focusKey) return;
    lastFocusedDateKey.current = focusKey;

    const timer = window.setTimeout(() => {
      document
        .getElementById(`provider-day-${normalizedInitialFocusDate}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    focusDateIsVisible,
    listingId,
    normalizedInitialFocusDate,
    operationsReady,
  ]);

  const summary = useMemo(() => {
    const decidedDays = selectProviderAvailabilityDecisions(days, decisionDates);
    const openDays = decidedDays.filter((day) => day.isOpen);
    const closedDays = decidedDays.filter((day) => !day.isOpen);
    return {
      openDays: openDays.length,
      totalCapacity: openDays.reduce((sum, day) => sum + day.capacity, 0),
      closedDays: closedDays.length,
      undecidedDays: Math.max(0, days.length - decidedDays.length),
    };
  }, [days, decisionDates]);

  const bulkStartDate =
    focusDateIsVisible && operationsReady
      ? normalizedInitialFocusDate
      : operationsReady
        ? days[0]?.date ?? ""
        : "";
  const bulkPreview = useMemo(
    () =>
      applyProviderAvailabilityWindowDecision(days, decisionDates, {
        startDate: bulkStartDate,
        windowDays: bulkWindowDays,
        isOpen: true,
        startTime: bulkStartTime,
        endTime: bulkEndTime,
        capacity: defaultCapacity,
      }),
    [
      bulkEndTime,
      bulkStartDate,
      bulkStartTime,
      bulkWindowDays,
      days,
      decisionDates,
      defaultCapacity,
    ],
  );
  const bulkCruisePreview = useMemo(
    () =>
      applyProviderAvailabilityWindowDecision(days, decisionDates, {
        startDate: bulkStartDate,
        windowDays: bulkWindowDays,
        isOpen: true,
        startTime: bulkStartTime,
        endTime: bulkEndTime,
        capacity: defaultCapacity,
        targetDates: cruiseDemandTargetDates,
      }),
    [
      bulkEndTime,
      bulkStartDate,
      bulkStartTime,
      bulkWindowDays,
      cruiseDemandTargetDates,
      days,
      decisionDates,
      defaultCapacity,
    ],
  );

  async function loadProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listingId.trim()) return;
    await loadProviderById(listingId, false);
  }

  async function saveProvider() {
    const normalizedListingId = listingId.trim().slice(0, 160);
    if (!operationsReady || normalizedListingId !== loadedListingId) {
      setError("Refresh this business before saving availability changes.");
      return;
    }
    if (!normalizedListingId || !listingName.trim()) {
      setError("Choose a business and enter its provider name before saving.");
      return;
    }
    if (!listingIsAllowed(normalizedListingId)) {
      setError("This business is not assigned to your merchant account.");
      return;
    }

    const explicitDays = selectProviderAvailabilityDecisions(
      days,
      decisionDates,
    );

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
          days: explicitDays,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ProviderOperationsPayload
        | null;
      if (!response.ok || !payload?.config) {
        throw new Error(
          payload?.error || "Unable to save provider operations.",
        );
      }
      const persistedDates =
        payload.persistedDates ?? explicitDays.map((day) => day.date);
      setDecisionDates(toDateSet(persistedDates));
      setMessage(
        `${persistedDates.length} explicit availability ${persistedDates.length === 1 ? "decision" : "decisions"} saved. Untouched future dates remain undecided.`,
      );
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
    setLoadedListingId("");
    setListingName(
      normalizedListingId ? humanizeListingId(normalizedListingId) : "",
    );
    setDefaultCapacity(10);
    setDays(normalizedListingId ? buildProviderAvailabilityDays(10) : []);
    setDecisionDates(new Set());
    setCruiseDemandDates([]);
    setCruiseScheduleCoverage(null);
    setMessage(null);
    setError(null);
    if (normalizedListingId) {
      void loadProviderById(normalizedListingId, false);
    }
  }

  function updateDay(index: number, patch: Partial<ProviderAvailabilityDay>) {
    if (!operationsReady) return;
    const date = days[index]?.date;
    if (date) {
      setDecisionDates((current) => {
        if (current.has(date)) return current;
        const next = new Set(current);
        next.add(date);
        return next;
      });
    }
    setDays((current) =>
      current.map((day, currentIndex) =>
        currentIndex === index ? { ...day, ...patch } : day,
      ),
    );
  }

  function applyBulkDecision(
    isOpen: boolean,
    scope: "all" | "cruise" = "all",
  ) {
    if (!operationsReady) {
      setError("Refresh this business before staging bulk availability.");
      return;
    }
    if (isOpen && bulkStartTime >= bulkEndTime) {
      setError("Bulk operating end time must be later than the start time.");
      return;
    }

    const result = applyProviderAvailabilityWindowDecision(
      days,
      decisionDates,
      {
        startDate: bulkStartDate,
        windowDays: bulkWindowDays,
        isOpen,
        startTime: bulkStartTime,
        endTime: bulkEndTime,
        capacity: defaultCapacity,
        ...(scope === "cruise" ? { targetDates: cruiseDemandTargetDates } : {}),
      },
    );

    setError(null);
    const scopeLabel = scope === "cruise" ? "cruise-demand " : "";
    if (!result.appliedCount) {
      setMessage(
        result.startDate && result.endDate
          ? `No undecided ${scopeLabel}dates remain from ${result.startDate} through ${result.endDate}. Existing decisions were left unchanged.`
          : "No bulk availability window is available yet.",
      );
      return;
    }

    setDays(result.days);
    setDecisionDates(toDateSet(result.decisionDates));
    setMessage(
      `${result.appliedCount} undecided ${scopeLabel}${result.appliedCount === 1 ? "date" : "dates"} staged ${isOpen ? "open" : "closed"} from ${result.startDate} through ${result.endDate}. Existing decisions were preserved. Save operations to publish the staged decisions.`,
    );
  }

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
                each participating business. Untouched future dates stay
                undecided until you explicitly open, close, or edit them.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveProvider()}
              disabled={saving || merchantHasNoScope || !operationsReady}
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
                onChange={(event) => {
                  setListingId(event.target.value);
                  setLoadedListingId("");
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
                placeholder="provider-listing-id"
              />
            )}
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Provider name
            <input
              required
              disabled={editorDisabled}
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
              disabled={editorDisabled}
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
        {focusDateIsVisible && operationsReady ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-950">
            Cruise capacity action: review {normalizedInitialFocusDate}, set the
            operating decision for this date, then save operations.
            {focusCruiseDemand ? (
              <span className="mt-2 block text-xs font-semibold text-amber-900/80">
                Official demand: {focusCruiseDemand.callCount} ship
                {focusCruiseDemand.callCount === 1 ? "" : "s"} · {focusCruiseDemand.shipNames.slice(0, 3).join(", ")} · {focusCruiseDemand.earliestArrivalAt}–{focusCruiseDemand.latestDepartureAt}.
              </span>
            ) : null}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={CalendarDays}
            label="Open dates"
            value={String(summary.openDays)}
          />
          <Metric
            icon={Users}
            label="Open capacity"
            value={String(summary.totalCapacity)}
          />
          <Metric
            icon={ShieldCheck}
            label="Closed dates"
            value={String(summary.closedDays)}
          />
          <Metric
            icon={Clock3}
            label="Undecided dates"
            value={String(summary.undecidedDays)}
          />
        </section>

        <section className="mt-6 rounded-[30px] border border-teal-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                <CalendarRange className="h-4 w-4" /> Quick-fill undecided dates
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331]">
                Stage a safe operating window without overwriting reviewed dates.
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                The window starts at the highlighted cruise date when present,
                otherwise at the first date shown. Only undecided rows are
                changed; existing open or closed decisions are preserved.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
              {operationsReady && bulkPreview.startDate && bulkPreview.endDate ? (
                <>
                  {bulkPreview.appliedCount} undecided {bulkPreview.appliedCount === 1 ? "date" : "dates"}
                  <br />
                  {bulkPreview.startDate} → {bulkPreview.endDate}
                </>
              ) : (
                "Refresh the business to load the operating horizon."
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
              Window
              <select
                value={bulkWindowDays}
                disabled={editorDisabled}
                onChange={(event) => setBulkWindowDays(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600 disabled:bg-slate-100"
              >
                {BULK_WINDOW_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    Next {value} days
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Bulk start"
              value={bulkStartTime}
              type="time"
              disabled={editorDisabled}
              onChange={setBulkStartTime}
            />
            <Field
              label="Bulk end"
              value={bulkEndTime}
              type="time"
              disabled={editorDisabled}
              onChange={setBulkEndTime}
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                Open capacity
              </p>
              <p className="mt-2 text-xl font-black text-[#043331]">
                {defaultCapacity}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">
                Uses the current default capacity above.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={editorDisabled || bulkPreview.appliedCount === 0}
              onClick={() => applyBulkDecision(true)}
              className="min-h-12 rounded-2xl bg-emerald-100 px-5 text-[9px] font-black uppercase tracking-[.13em] text-emerald-800 disabled:opacity-50"
            >
              Stage all undecided open
            </button>
            <button
              type="button"
              disabled={editorDisabled || bulkPreview.appliedCount === 0}
              onClick={() => applyBulkDecision(false)}
              className="min-h-12 rounded-2xl bg-slate-100 px-5 text-[9px] font-black uppercase tracking-[.13em] text-slate-700 disabled:opacity-50"
            >
              Stage all undecided closed
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-cyan-200 bg-cyan-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-cyan-800">
                  <ShipWheel className="h-4 w-4" /> Cruise dates only
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-cyan-950/75">
                  {cruiseDemandDates.length
                    ? `${cruiseDemandDates.length} matched ship-call ${cruiseDemandDates.length === 1 ? "date is" : "dates are"} loaded for this business. ${bulkCruisePreview.appliedCount} undecided ${bulkCruisePreview.appliedCount === 1 ? "date falls" : "dates fall"} inside the selected window.`
                    : "No active cruise-ready offers currently match an official ship-call date for this business in the loaded schedule."}
                </p>
              </div>
              {cruiseScheduleCoverage ? (
                <div className="shrink-0 rounded-xl border border-cyan-200 bg-white/70 px-3 py-2 text-[9px] font-black uppercase tracking-[.1em] text-cyan-800">
                  Official coverage
                  <span className="mt-1 block normal-case tracking-normal text-cyan-950">
                    {cruiseScheduleCoverage.from} → {cruiseScheduleCoverage.through}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={editorDisabled || bulkCruisePreview.appliedCount === 0}
                onClick={() => applyBulkDecision(true, "cruise")}
                className="min-h-12 rounded-2xl bg-cyan-800 px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
              >
                Stage cruise dates open
              </button>
              <button
                type="button"
                disabled={editorDisabled || bulkCruisePreview.appliedCount === 0}
                onClick={() => applyBulkDecision(false, "cruise")}
                className="min-h-12 rounded-2xl border border-cyan-300 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] text-cyan-900 disabled:opacity-50"
              >
                Stage cruise dates closed
              </button>
            </div>
            <p className="mt-3 text-[10px] font-semibold text-cyan-950/65">
              Cruise-only actions use official calls matched to active excursion
              offers and their sellable windows. Dates beyond the coverage shown
              above are not treated as demand-free.
            </p>
          </div>

          <p className="mt-3 text-[10px] font-semibold text-slate-500">
            Bulk actions are staged locally first. Use Save operations to publish
            them. Dates already reviewed are never changed by these buttons.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {days.map((day, index) => {
            const focused =
              focusDateIsVisible && day.date === normalizedInitialFocusDate;
            const decided = decisionDates.has(day.date);
            const cruiseDemand = cruiseDemandByDate.get(day.date) ?? null;
            return (
              <article
                id={`provider-day-${day.date}`}
                key={day.date}
                className={`scroll-mt-24 grid gap-3 rounded-[28px] border bg-white p-5 shadow-sm md:grid-cols-[210px_150px_120px_120px_130px_1fr] md:items-end ${
                  focused
                    ? "border-amber-400 ring-4 ring-amber-200/60"
                    : cruiseDemand && !decided
                      ? "border-cyan-300"
                      : decided
                        ? "border-teal-200"
                        : "border-slate-200"
                }`}
              >
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    {focused ? "Cruise date" : "Date"}
                  </p>
                  <p className="mt-2 text-sm font-black">{day.date}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[7px] font-black uppercase tracking-[.12em] ${
                        decided
                          ? "bg-teal-100 text-teal-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {decided ? "Decision set" : "Undecided"}
                    </span>
                    {cruiseDemand ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[.1em] text-cyan-800">
                        <ShipWheel className="h-3 w-3" /> {cruiseDemand.callCount} ship
                        {cruiseDemand.callCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  {cruiseDemand ? (
                    <div className="mt-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[9px] font-semibold leading-4 text-cyan-950/75">
                      <span className="font-black text-cyan-900">
                        {cruiseDemand.shipNames.slice(0, 2).join(", ")}
                        {cruiseDemand.shipNames.length > 2
                          ? ` +${cruiseDemand.shipNames.length - 2}`
                          : ""}
                      </span>
                      <br />
                      {cruiseDemand.earliestArrivalAt}–{cruiseDemand.latestDepartureAt} · {cruiseDemand.offerCount} active excursion
                      {cruiseDemand.offerCount === 1 ? "" : "s"}
                    </div>
                  ) : null}
                </div>
                <div className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                  Decision
                  {decided ? (
                    <button
                      type="button"
                      disabled={editorDisabled}
                      onClick={() => updateDay(index, { isOpen: !day.isOpen })}
                      className={`mt-2 min-h-11 w-full rounded-2xl text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50 ${
                        day.isOpen
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {day.isOpen ? "Open" : "Closed"}
                    </button>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={editorDisabled}
                        onClick={() => updateDay(index, { isOpen: true })}
                        className="min-h-11 rounded-xl bg-emerald-100 px-2 text-[8px] font-black uppercase tracking-[.08em] text-emerald-800 disabled:opacity-50"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        disabled={editorDisabled}
                        onClick={() => updateDay(index, { isOpen: false })}
                        className="min-h-11 rounded-xl bg-slate-100 px-2 text-[8px] font-black uppercase tracking-[.08em] text-slate-700 disabled:opacity-50"
                      >
                        Keep closed
                      </button>
                    </div>
                  )}
                </div>
                <Field
                  label="Start"
                  value={day.startTime}
                  type="time"
                  disabled={editorDisabled}
                  onChange={(value) => updateDay(index, { startTime: value })}
                />
                <Field
                  label="End"
                  value={day.endTime}
                  type="time"
                  disabled={editorDisabled}
                  onChange={(value) => updateDay(index, { endTime: value })}
                />
                <Field
                  label="Capacity"
                  value={String(day.capacity)}
                  type="number"
                  disabled={editorDisabled}
                  onChange={(value) =>
                    updateDay(index, { capacity: Number(value) || 0 })
                  }
                />
                <Field
                  label="Operations note"
                  value={day.note ?? ""}
                  disabled={editorDisabled}
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

function toDateSet(values: string[] | undefined) {
  return new Set(
    (Array.isArray(values) ? values : []).filter((value) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value),
    ),
  );
}

function validCoverage(
  value: CruiseScheduleCoverage | undefined,
): value is CruiseScheduleCoverage {
  return Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.from) &&
      /^\d{4}-\d{2}-\d{2}$/.test(value.through) &&
      value.through >= value.from,
  );
}