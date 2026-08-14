"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudLightning,
  Clock3,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { summarizeJourneyPlan } from "@/lib/intelligence/active-trip";
import {
  getIntelligenceMemory,
  INTELLIGENCE_MEMORY_UPDATED_EVENT,
} from "@/lib/intelligence/client";
import {
  buildTripRiskPrompt,
  evaluateTripRisk,
  type TripRiskIssue,
  type TripWeatherAlert,
} from "@/lib/intelligence/trip-risk";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type {
  IntelligenceIsland,
  IntelligenceMemory,
} from "@/types/intelligence";

type WeatherPayload = {
  status?: "available" | "unavailable";
  alerts?: TripWeatherAlert[];
};

type ProactiveTripIntelligenceProps = {
  mode?: "full" | "banner";
  islandOverride?: IntelligenceIsland;
};

export function ProactiveTripIntelligence({
  mode = "full",
  islandOverride,
}: ProactiveTripIntelligenceProps) {
  const [memory, setMemory] = useState<IntelligenceMemory>({});
  const [journey, setJourney] = useState<JourneyPlan | null>(null);
  const [alerts, setAlerts] = useState<TripWeatherAlert[]>([]);
  const [weatherStatus, setWeatherStatus] = useState<
    "loading" | "available" | "unavailable"
  >("loading");
  const [weatherRefresh, setWeatherRefresh] = useState(0);

  useEffect(() => {
    function refreshLocalState() {
      setMemory(getIntelligenceMemory());
      setJourney(readJourneyPlans()[0] ?? null);
    }
    refreshLocalState();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshLocalState);
    window.addEventListener(
      INTELLIGENCE_MEMORY_UPDATED_EVENT,
      refreshLocalState,
    );
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshLocalState);
      window.removeEventListener(
        INTELLIGENCE_MEMORY_UPDATED_EVENT,
        refreshLocalState,
      );
    };
  }, []);

  const savedTrip = useMemo(
    () => summarizeJourneyPlan(journey) ?? memory.activeTrip,
    [journey, memory.activeTrip],
  );
  const activeTrip =
    islandOverride && savedTrip?.island !== islandOverride ? undefined : savedTrip;
  const island =
    islandOverride ?? activeTrip?.island ?? memory.preferredIsland ?? ("stt" as IntelligenceIsland);

  useEffect(() => {
    const controller = new AbortController();
    setWeatherStatus("loading");
    void fetch(`/api/trip-intelligence?island=${island}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | WeatherPayload
          | null;
        if (!response.ok || !payload) throw new Error("Weather signal failed");
        setAlerts(Array.isArray(payload.alerts) ? payload.alerts : []);
        setWeatherStatus(
          payload.status === "available" ? "available" : "unavailable",
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAlerts([]);
        setWeatherStatus("unavailable");
      });
    return () => controller.abort();
  }, [island, weatherRefresh]);

  const report = useMemo(
    () => evaluateTripRisk(activeTrip, memory, { weatherAlerts: alerts }),
    [activeTrip, alerts, memory],
  );
  const theme = statusTheme(report.status);
  const promptHref = `/concierge?island=${island}&open=true&prompt=${encodeURIComponent(
    buildTripRiskPrompt(report, activeTrip),
  )}`;
  const visibleIssues = report.issues.slice(0, mode === "banner" ? 2 : 5);

  return (
    <section
      className={
        mode === "banner"
          ? "border-b border-slate-200 bg-[#f7f2e7] px-4 py-4 sm:px-6"
          : "bg-[#f7f2e7] px-4 py-6 sm:px-6"
      }
    >
      <div
        className={`mx-auto overflow-hidden border shadow-sm ${
          mode === "banner"
            ? "max-w-7xl rounded-[26px]"
            : "max-w-7xl rounded-[34px]"
        } ${theme.shell}`}
      >
        <div
          className={`grid gap-5 p-5 sm:p-6 ${
            mode === "full" ? "lg:grid-cols-[230px_1fr]" : "lg:grid-cols-[190px_1fr]"
          }`}
        >
          <div className={`rounded-[24px] p-5 ${theme.scoreCard}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] font-black uppercase tracking-[.18em] opacity-70">
                Trip health
              </span>
              {report.status === "healthy" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div className="mt-4 text-5xl font-black tracking-[-.06em]">
              {report.score}
            </div>
            <div className="mt-1 text-xs font-black uppercase tracking-[.16em] opacity-75">
              {statusLabel(report.status)}
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 opacity-75">
              {activeTrip
                ? `${activeTrip.title} · ${activeTrip.date}`
                : "No saved journey selected"}
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                  <Route className="h-4 w-4" /> Proactive trip intelligence
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-[-.04em] text-[#043331] sm:text-3xl">
                  {report.summary}
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  VI Guide is checking schedule pressure, transfer buffers,
                  accessibility, booking uncertainty, official weather alerts,
                  and cruise return timing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWeatherRefresh((value) => value + 1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.14em] text-slate-600"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ${
                      weatherStatus === "loading" ? "animate-spin" : ""
                    }`}
                  />
                  Recheck
                </button>
                <Link
                  href={promptHref}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
                >
                  <Sparkles className="h-4 w-4 text-[#f5c451]" /> Fix with AI
                </Link>
              </div>
            </div>

            {report.returnWindow ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric
                  icon={Clock3}
                  label="Protected return"
                  value={report.returnWindow.safeReturnByTime}
                />
                <Metric
                  icon={ShieldCheck}
                  label="All aboard"
                  value={report.returnWindow.allAboardTime}
                />
                <Metric
                  icon={Route}
                  label="Estimated buffer"
                  value={
                    typeof report.returnWindow.estimatedBufferMinutes === "number"
                      ? `${report.returnWindow.estimatedBufferMinutes} min`
                      : "Needs times"
                  }
                />
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {visibleIssues.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
              {!visibleIssues.length ? (
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 lg:col-span-2">
                  <div className="flex items-center gap-2 font-black">
                    <CheckCircle2 className="h-5 w-5" /> No material trip risks detected
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-emerald-800/80">
                    This assessment uses the saved itinerary and available live
                    signals. Continue to verify operating hours, availability,
                    and transportation on the travel day.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <CloudLightning className="h-4 w-4 text-teal-700" />
                {weatherStatus === "loading"
                  ? "Checking official weather alerts…"
                  : weatherStatus === "unavailable"
                    ? "Official weather alert feed is temporarily unavailable"
                    : alerts.length
                      ? `${alerts.length} active official ${alerts.length === 1 ? "alert" : "alerts"} returned`
                      : "No active official NWS alert returned"}
              </div>
              <div className="flex items-center gap-3">
                <span>Alert feed only—not a full forecast.</span>
                <Link
                  href="/planner"
                  className="font-black text-teal-700"
                >
                  Open planner →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RiskCard({ risk }: { risk: TripRiskIssue }) {
  const tone = issueTheme(risk.severity);
  return (
    <article className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <div className="text-[8px] font-black uppercase tracking-[.16em] opacity-65">
            {risk.severity} · {risk.category.replaceAll("_", " ")}
          </div>
          <h3 className="mt-1 font-black">{risk.title}</h3>
          <p className="mt-2 text-xs font-semibold leading-5 opacity-75">
            {risk.detail}
          </p>
          <p className="mt-2 text-xs font-black leading-5">
            {risk.recommendation}
          </p>
          {risk.sourceUrl ? (
            <a
              href={risk.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-[9px] font-black uppercase tracking-[.13em] underline"
            >
              Official alert details
            </a>
          ) : null}
        </div>
      </div>
    </article>
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
    <div className="rounded-[20px] border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.15em] text-slate-400">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </div>
      <div className="mt-2 text-xl font-black text-[#043331]">{value}</div>
    </div>
  );
}

function statusLabel(status: ReturnType<typeof evaluateTripRisk>["status"]) {
  if (status === "critical") return "Critical";
  if (status === "attention") return "Needs attention";
  if (status === "watch") return "Watch";
  if (status === "not_ready") return "Not ready";
  if (status === "past") return "Past trip";
  return "Protected";
}

function statusTheme(status: ReturnType<typeof evaluateTripRisk>["status"]) {
  if (status === "critical") {
    return {
      shell: "border-rose-200 bg-white",
      scoreCard: "bg-rose-700 text-white",
    };
  }
  if (status === "attention") {
    return {
      shell: "border-amber-200 bg-white",
      scoreCard: "bg-amber-500 text-[#3f2c00]",
    };
  }
  if (status === "watch") {
    return {
      shell: "border-yellow-200 bg-white",
      scoreCard: "bg-yellow-100 text-yellow-950",
    };
  }
  if (status === "healthy") {
    return {
      shell: "border-emerald-200 bg-white",
      scoreCard: "bg-emerald-700 text-white",
    };
  }
  return {
    shell: "border-slate-200 bg-white",
    scoreCard: "bg-slate-200 text-slate-800",
  };
}

function issueTheme(severity: TripRiskIssue["severity"]) {
  if (severity === "critical") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "high") return "border-amber-200 bg-amber-50 text-amber-950";
  if (severity === "medium") return "border-yellow-200 bg-yellow-50 text-yellow-950";
  if (severity === "low") return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}
