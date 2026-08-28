"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import { buildJourneyMobilityHref } from "@/lib/mobility/ride-links";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_STORAGE_KEY,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
  writeSelectedTravelerTripPlanId,
} from "@/lib/traveler-trip-selection";

type ManualStatus = "pending" | "pass" | "fail" | "blocked";
type ManualStepId =
  | "history"
  | "map"
  | "concierge"
  | "mobility"
  | "checkout"
  | "cancel";

type RuntimeState = {
  width: number;
  height: number;
  touchPoints: number;
  viewport: string;
  storageWritable: boolean;
  userAgent: string;
};

type TravelerQaLinks = {
  trips: string;
  map: string;
  concierge: string;
  mobility: string;
};

const EMPTY_RUNTIME: RuntimeState = {
  width: 0,
  height: 0,
  touchPoints: 0,
  viewport: "",
  storageWritable: false,
  userAgent: "",
};

const DEFAULT_MANUAL: Record<ManualStepId, ManualStatus> = {
  history: "pending",
  map: "pending",
  concierge: "pending",
  mobility: "pending",
  checkout: "pending",
  cancel: "pending",
};

const MANUAL_STEPS: Array<{
  id: ManualStepId;
  title: string;
  detail: string;
  link: keyof TravelerQaLinks;
}> = [
  {
    id: "history",
    title: "My Trip + Safari back/forward",
    detail:
      "Open My Trip. If you have more than one saved trip, switch trips and use Safari Back/Forward. The selected trip header and live ride controls must switch together. With one trip, refresh and use Back/Forward to confirm the same trip remains selected.",
    link: "trips",
  },
  {
    id: "map",
    title: "Bottom-nav Living Map",
    detail:
      "From My Trip, tap Live Map in the persistent mobile navigation. The URL must keep both the active trip ID and the trip island; returning to My Trip must restore the same trip.",
    link: "trips",
  },
  {
    id: "concierge",
    title: "Bottom-nav Concierge",
    detail:
      "From My Trip, tap Concierge in the persistent mobile navigation. The URL and Concierge context must stay attached to the same JourneyPlan and island.",
    link: "trips",
  },
  {
    id: "mobility",
    title: "Trip-aware Mobility review",
    detail:
      "Open Mobility from this harness. Confirm the booking card opens at #book with the same trip, pickup/destination context, and fail-closed official fare behavior when an estate still needs confirmation.",
    link: "mobility",
  },
  {
    id: "checkout",
    title: "Stripe test checkout + return",
    detail:
      "Proceed only if Checkout visibly identifies a Stripe test/sandbox flow. Use Stripe's standard test card 4242 4242 4242 4242 with any future expiry/CVC. If the page is live-mode or does not clearly identify test mode, mark this step Blocked and do not submit payment. A test success or failure must return to the same trip-aware Mobility/My Trip context.",
    link: "mobility",
  },
  {
    id: "cancel",
    title: "Cancel only the QA ride",
    detail:
      "Only after creating an unmistakable test ride, return to My Trip and cancel that QA ride. Confirm the active trip's live card changes and rides from any other saved trip remain untouched. If no isolated test ride exists, mark Blocked rather than canceling a real ride.",
    link: "trips",
  },
];

function buildQaLinks(plan: JourneyPlan | null): TravelerQaLinks {
  if (!plan) {
    return {
      trips: "/trips",
      map: "/map",
      concierge: "/concierge",
      mobility: "/mobility",
    };
  }

  const trip = encodeURIComponent(plan.id);
  return {
    trips: `/trips?trip=${trip}`,
    map: `/map?island=${plan.island}&trip=${trip}`,
    concierge: `/concierge?island=${plan.island}&trip=${trip}`,
    mobility: buildJourneyMobilityHref(plan),
  };
}

function manualStorageKey(planId: string) {
  return `vi-guide.admin-traveler-qa.v1:${planId || "no-trip"}`;
}

function readRuntimeState(): RuntimeState {
  if (typeof window === "undefined") return EMPTY_RUNTIME;
  let storageWritable = false;
  try {
    const key = "vi-guide.qa-storage-probe";
    window.localStorage.setItem(key, "1");
    storageWritable = window.localStorage.getItem(key) === "1";
    window.localStorage.removeItem(key);
  } catch {
    storageWritable = false;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    touchPoints: navigator.maxTouchPoints || 0,
    viewport:
      document
        .querySelector('meta[name="viewport"]')
        ?.getAttribute("content") ?? "",
    storageWritable,
    userAgent: navigator.userAgent,
  };
}

function parseInternalHref(href: string) {
  if (typeof window === "undefined") return null;
  try {
    return new URL(href, window.location.origin);
  } catch {
    return null;
  }
}

export function AuthenticatedTravelerQa({
  serverRole,
}: {
  serverRole: "admin";
}) {
  const { user, loading } = useAuth();
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [runtime, setRuntime] = useState<RuntimeState>(EMPTY_RUNTIME);
  const [manual, setManual] =
    useState<Record<ManualStepId, ManualStatus>>(DEFAULT_MANUAL);
  const [copied, setCopied] = useState(false);

  function refresh() {
    setPlans(readJourneyPlans());
    setSelectedPlanId(readSelectedTravelerTripPlanId());
    setRuntime(readRuntimeState());
  }

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        !event.key ||
        event.key === "vi-guide.intelligence.saved-plans" ||
        event.key === TRAVELER_TRIP_SELECTION_STORAGE_KEY
      ) {
        refresh();
      }
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("resize", refresh);
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const links = useMemo(() => buildQaLinks(selectedPlan), [selectedPlan]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(
        manualStorageKey(selectedPlan?.id ?? ""),
      );
      const parsed = raw ? (JSON.parse(raw) as Partial<typeof DEFAULT_MANUAL>) : {};
      setManual({ ...DEFAULT_MANUAL, ...parsed });
    } catch {
      setManual(DEFAULT_MANUAL);
    }
  }, [selectedPlan?.id]);

  const automaticChecks = useMemo(() => {
    const tripUrl = parseInternalHref(links.trips);
    const mapUrl = parseInternalHref(links.map);
    const conciergeUrl = parseInternalHref(links.concierge);
    const mobilityUrl = parseInternalHref(links.mobility);
    const planId = selectedPlan?.id ?? "";
    const island = selectedPlan?.island ?? "";

    return [
      {
        id: "server-session",
        label: "Server session is administrator-authenticated",
        pass: serverRole === "admin",
        detail: "This page cannot render without the production HttpOnly session cookie.",
      },
      {
        id: "firebase-client",
        label: "Firebase browser session is present",
        pass: !loading && Boolean(user),
        detail: loading
          ? "Firebase Auth is still hydrating."
          : user
            ? "Client auth and server auth are both present."
            : "Server session exists, but the Firebase browser identity is missing.",
      },
      {
        id: "saved-plan",
        label: "A valid active JourneyPlan is selected",
        pass: Boolean(selectedPlan),
        detail: selectedPlan
          ? `${selectedPlan.title} · ${selectedPlan.island.toUpperCase()} · ${selectedPlan.plan.length} saved stops`
          : plans.length
            ? "Saved trips exist, but none is the active traveler selection."
            : "No saved JourneyPlan is available in this browser yet.",
      },
      {
        id: "trip-link",
        label: "My Trip link carries the selected JourneyPlan",
        pass: Boolean(planId && tripUrl?.searchParams.get("trip") === planId),
        detail: links.trips,
      },
      {
        id: "map-link",
        label: "Living Map link carries trip + island",
        pass: Boolean(
          planId &&
            island &&
            mapUrl?.searchParams.get("trip") === planId &&
            mapUrl.searchParams.get("island") === island,
        ),
        detail: links.map,
      },
      {
        id: "concierge-link",
        label: "Concierge link carries trip + island",
        pass: Boolean(
          planId &&
            island &&
            conciergeUrl?.searchParams.get("trip") === planId &&
            conciergeUrl.searchParams.get("island") === island,
        ),
        detail: links.concierge,
      },
      {
        id: "mobility-link",
        label: "Mobility handoff is canonical and returns to My Trip",
        pass: Boolean(
          planId &&
            island &&
            mobilityUrl?.pathname === "/mobility" &&
            mobilityUrl.searchParams.get("trip") === planId &&
            mobilityUrl.searchParams.get("island") === island &&
            mobilityUrl.searchParams.get("source") === "concierge" &&
            mobilityUrl.searchParams.get("returnTo") === "/trips" &&
            mobilityUrl.hash === "#book",
        ),
        detail: links.mobility,
      },
      {
        id: "storage",
        label: "Traveler persistence storage is writable",
        pass: runtime.storageWritable,
        detail: runtime.storageWritable
          ? "JourneyPlan selection can persist across refresh/navigation in this browser."
          : "Browser privacy/storage policy is preventing persistent traveler state.",
      },
      {
        id: "viewport",
        label: "iOS safe-area viewport is enabled",
        pass: runtime.viewport.includes("viewport-fit=cover"),
        detail: runtime.viewport || "Viewport meta tag not detected.",
      },
    ];
  }, [links, loading, plans.length, runtime, selectedPlan, serverRole, user]);

  const automaticPassed = automaticChecks.filter((check) => check.pass).length;
  const manualPassed = Object.values(manual).filter((status) => status === "pass").length;
  const manualBlocked = Object.values(manual).filter(
    (status) => status === "blocked",
  ).length;

  function chooseFirstPlan() {
    const first = plans[0];
    if (!first) return;
    writeSelectedTravelerTripPlanId(first.id);
    refresh();
  }

  function setManualStatus(id: ManualStepId, status: ManualStatus) {
    const next = { ...manual, [id]: status };
    setManual(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          manualStorageKey(selectedPlan?.id ?? ""),
          JSON.stringify(next),
        );
      } catch {
        // The automatic storage check already surfaces this browser limitation.
      }
    }
  }

  async function copyReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      role: serverRole,
      trip: selectedPlan
        ? {
            id: selectedPlan.id,
            title: selectedPlan.title,
            island: selectedPlan.island,
            stopCount: selectedPlan.plan.length,
          }
        : null,
      automatic: automaticChecks.map(({ id, label, pass, detail }) => ({
        id,
        label,
        pass,
        detail,
      })),
      manual,
      device: {
        width: runtime.width,
        height: runtime.height,
        touchPoints: runtime.touchPoints,
        userAgent: runtime.userAgent,
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 pb-32 pt-6 text-[#043331] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.24),transparent_38%),linear-gradient(145deg,#043331,#075e58)] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f8d77c]">
                <ShieldCheck className="h-4 w-4" />
                Administrator-only production QA
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">
                Authenticated traveler journey
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-teal-50/80">
                Validate the real signed-in My Trip → Living Map → Concierge →
                Mobility → Checkout → My Trip flow on this browser without adding
                a login bypass or weakening regulated fare/payment boundaries.
              </p>
            </div>
            <div className="grid min-w-[190px] gap-2 rounded-2xl border border-white/15 bg-white/10 p-4 text-xs font-bold">
              <span>{automaticPassed}/{automaticChecks.length} automatic checks</span>
              <span>{manualPassed}/{MANUAL_STEPS.length} device checks passed</span>
              {manualBlocked ? <span>{manualBlocked} safely blocked</span> : null}
            </div>
          </div>
        </header>

        {!selectedPlan ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1">
                <h2 className="font-black">Select a saved trip before device QA</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-amber-950/70">
                  {plans.length
                    ? "Saved JourneyPlans are present, but the traveler selection is empty or stale."
                    : "This browser has no saved JourneyPlan yet. Open the planner/My Trip flow first so the QA run uses real traveler state."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {plans.length ? (
                    <button
                      type="button"
                      onClick={chooseFirstPlan}
                      className="min-h-11 rounded-xl bg-[#043331] px-4 text-[10px] font-black uppercase tracking-[.14em] text-white"
                    >
                      Use first saved trip
                    </button>
                  ) : null}
                  <a
                    href="/planner"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-[10px] font-black uppercase tracking-[.14em]"
                  >
                    Open planner <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[28px] border border-[#d7e1df] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700">
                  Automatic production checks
                </p>
                <h2 className="mt-1 text-xl font-black">Session + journey continuity</h2>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#d7e1df] px-4 text-[9px] font-black uppercase tracking-[.14em]"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {automaticChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#e4ebe9] bg-[#fbfcfa] p-4"
                >
                  {check.pass ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-black">{check.label}</div>
                    <div className="mt-1 break-words text-xs font-semibold leading-5 text-[#526561]">
                      {check.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-[#d7e1df] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-700" />
                <h2 className="font-black">Current browser</h2>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#687b77]">Viewport</dt>
                  <dd className="font-black">{runtime.width} × {runtime.height}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#687b77]">Touch points</dt>
                  <dd className="font-black">{runtime.touchPoints}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#687b77]">Selected trip</dt>
                  <dd className="max-w-[65%] truncate text-right font-black">
                    {selectedPlan?.title ?? "None"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[28px] border border-[#d7e1df] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700">
                Exact launch URLs
              </p>
              <div className="mt-4 space-y-2 text-xs font-bold">
                {Object.entries(links).map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#e4ebe9] px-3 hover:bg-[#f7faf8]"
                  >
                    <span className="capitalize">{label}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[28px] border border-[#d7e1df] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700">
                Physical-device verification
              </p>
              <h2 className="mt-1 text-xl font-black">iPhone / iPad Safari run</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#60736f]">
                Each launch opens a separate tab so this QA dashboard remains available.
                Mark only what you actually observe. “Blocked” is the correct result when a
                safe test payment or isolated QA ride is not available.
              </p>
            </div>
            <button
              type="button"
              onClick={copyReport}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              <ClipboardCheck className="h-4 w-4" />
              {copied ? "Copied" : "Copy QA report"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {MANUAL_STEPS.map((step) => {
              const status = manual[step.id];
              return (
                <article
                  key={step.id}
                  className="rounded-2xl border border-[#e1e9e7] bg-[#fbfcfa] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{step.title}</h3>
                      <p className="mt-2 text-xs font-semibold leading-5 text-[#60736f]">
                        {step.detail}
                      </p>
                    </div>
                    <StatusPill status={status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={links[step.link]}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white"
                    >
                      Open test <ExternalLink className="h-4 w-4" />
                    </a>
                    {(["pass", "fail", "blocked"] as const).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        onClick={() => setManualStatus(step.id, nextStatus)}
                        className="min-h-11 rounded-xl border border-[#d7e1df] bg-white px-3 text-[9px] font-black uppercase tracking-[.12em]"
                      >
                        {nextStatus}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-950/80">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <strong className="font-black">Side-effect safety.</strong> This harness never
              creates users, bookings, rides, charges, refunds, or cancellations by itself.
              Those actions remain inside the real production surfaces and retain their normal
              authorization, tariff, payment, and confirmation gates.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: ManualStatus }) {
  const label = status === "pending" ? "Not run" : status;
  const classes =
    status === "pass"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "fail"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : status === "blocked"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-white text-slate-600";
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-[8px] font-black uppercase tracking-[.14em] ${classes}`}
    >
      {label}
    </span>
  );
}
