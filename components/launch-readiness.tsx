"use client";

import { useEffect, useMemo, useState } from "react";

type Check = { id: string; label: string; ready: boolean; detail: string };
type PilotIslandCode = "stt" | "stj" | "stx";
type PilotGate = {
  ready: boolean;
  issue?: string;
};
type PilotReport = {
  ready: boolean;
  tariff: PilotGate & { tariffId?: string; version?: string };
  association: PilotGate & { associationIds: string[] };
  fleet: PilotGate & {
    eligiblePairs: Array<{
      driverId: string;
      vehicleId: string;
      associationId: string;
    }>;
  };
};
type PilotIsland = {
  island: PilotIslandCode;
  control: {
    status: "active" | "inactive";
    activationAuditId?: string;
    activationReviewReference?: string;
  };
  report: PilotReport;
  effectiveActive: boolean;
  activationIssue?: string;
};

const ISLAND_LABELS: Record<PilotIslandCode, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const EMPTY_TEXT: Record<PilotIslandCode, string> = {
  stt: "",
  stj: "",
  stx: "",
};

const EMPTY_BOOL: Record<PilotIslandCode, boolean> = {
  stt: false,
  stj: false,
  stx: false,
};

export function LaunchReadiness() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [pilotIslands, setPilotIslands] = useState<PilotIsland[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyIsland, setBusyIsland] = useState<PilotIslandCode | null>(null);
  const [reviewReferences, setReviewReferences] = useState({ ...EMPTY_TEXT });
  const [pauseReasons, setPauseReasons] = useState({ ...EMPTY_TEXT });
  const [attested, setAttested] = useState({ ...EMPTY_BOOL });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [readinessResponse, pilotResponse] = await Promise.all([
        fetch("/api/admin/readiness", { cache: "no-store" }),
        fetch("/api/admin/mobility-pilot", { cache: "no-store" }),
      ]);
      const readinessJson = await readinessResponse.json();
      const pilotJson = await pilotResponse.json();
      if (!readinessResponse.ok) {
        throw new Error(readinessJson.error || "Readiness check failed.");
      }
      if (!pilotResponse.ok) {
        throw new Error(pilotJson.error || "Mobility pilot check failed.");
      }
      setChecks(Array.isArray(readinessJson.checks) ? readinessJson.checks : []);
      setPilotIslands(Array.isArray(pilotJson.islands) ? pilotJson.islands : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Readiness check failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const ready = checks.length > 0 && checks.every((check) => check.ready);
  const liveCount = useMemo(
    () => pilotIslands.filter((item) => item.effectiveActive).length,
    [pilotIslands],
  );

  async function changePilotStatus(island: PilotIslandCode, action: "activate" | "deactivate") {
    const reviewReference = reviewReferences[island].trim();
    const reason = pauseReasons[island].trim();
    if (!reviewReference || !attested[island]) return;
    if (action === "deactivate" && !reason) return;

    setBusyIsland(island);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/mobility-pilot/${island}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attested: true,
          reviewReference,
          ...(action === "deactivate" ? { reason } : {}),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || `Unable to ${action} mobility beta.`);
      }
      setNotice(
        action === "activate"
          ? `${ISLAND_LABELS[island]} public beta is active. The live server gates remain enforced on every booking.`
          : `${ISLAND_LABELS[island]} public beta is paused. New ride requests are blocked until reactivation.`,
      );
      setAttested((current) => ({ ...current, [island]: false }));
      setPauseReasons((current) => ({ ...current, [island]: "" }));
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to ${action} mobility beta.`);
    } finally {
      setBusyIsland(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 text-[#043331]">
      <section className={`rounded-[32px] p-7 text-white ${ready ? "bg-emerald-800" : "bg-[#043331]"}`}>
        <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Production gate</div>
        <h1 className="mt-3 text-4xl font-black">{ready ? "Public beta launch ready" : "Launch requirements"}</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/70">
          Configuration and minimum operating supply are checked here. Mobility activation remains island-specific, administrator-attested, auditable, and fail-closed if tariff or fleet requirements stop passing.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={refresh} disabled={loading} className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#043331] disabled:opacity-60">
            {loading ? "Checking…" : "Run checks again"}
          </button>
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
            {liveCount} of {pilotIslands.length || 3} islands live
          </span>
        </div>
      </section>

      {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-800">{error}</div> : null}
      {notice ? <div aria-live="polite" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">{notice}</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <div key={check.id} className={`rounded-[24px] border p-5 ${check.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="font-black">{check.label}</div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${check.ready ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-950"}`}>
                {check.ready ? "Ready" : "Required"}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">{check.detail}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-[32px] border border-[#0b5d5b]/10 bg-white shadow-[0_20px_70px_rgba(4,51,49,.10)]">
        <header className="bg-[#043331] px-6 py-6 text-white">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Controlled public beta</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Activate only verified island supply.</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/70">
            Activation never bypasses the regulated fare engine. The server re-checks the active tariff, reviewed taxi association, and eligible driver/vehicle pair before activation and again during live booking.
          </p>
        </header>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          {pilotIslands.map((item) => {
            const island = item.island;
            const live = item.effectiveActive;
            const blocked = !item.report.ready;
            const reviewReference = reviewReferences[island];
            const pauseReason = pauseReasons[island];
            const isBusy = busyIsland === island;
            const canActivate = !live && !blocked && attested[island] && reviewReference.trim().length > 0 && !isBusy;
            const canPause = live && attested[island] && reviewReference.trim().length > 0 && pauseReason.trim().length > 0 && !isBusy;

            return (
              <article key={island} className="rounded-[26px] border border-slate-200 bg-[#fbfaf6] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-teal-700">{island.toUpperCase()}</div>
                    <h3 className="mt-1 text-xl font-black">{ISLAND_LABELS[island]}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase ${live ? "bg-emerald-200 text-emerald-900" : blocked ? "bg-amber-200 text-amber-950" : "bg-sky-100 text-sky-900"}`}>
                    {live ? "Beta live" : blocked ? "Blocked" : "Ready to activate"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <GatePill label="Tariff" ready={item.report.tariff.ready} />
                  <GatePill label="Association" ready={item.report.association.ready} />
                  <GatePill label="Fleet" ready={item.report.fleet.ready} />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold leading-5 text-slate-600">
                  <div>{item.report.association.associationIds.length} reviewed association{item.report.association.associationIds.length === 1 ? "" : "s"}</div>
                  <div>{item.report.fleet.eligiblePairs.length} eligible driver/vehicle pair{item.report.fleet.eligiblePairs.length === 1 ? "" : "s"}</div>
                  {item.report.tariff.version ? <div>Tariff version {item.report.tariff.version}</div> : null}
                  {item.activationIssue ? <div className="mt-2 font-bold text-amber-800">{item.activationIssue}</div> : null}
                  {!item.report.ready ? (
                    <div className="mt-2 font-bold text-amber-800">
                      {[item.report.tariff.issue, item.report.association.issue, item.report.fleet.issue].filter(Boolean).join(" ")}
                    </div>
                  ) : null}
                </div>

                <label className="mt-4 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                  Review reference
                  <input
                    value={reviewReference}
                    onChange={(event) => setReviewReferences((current) => ({ ...current, [island]: event.target.value }))}
                    placeholder="e.g. Public beta review 2026-08-26"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-900"
                  />
                </label>

                {live ? (
                  <label className="mt-3 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                    Pause reason
                    <input
                      value={pauseReason}
                      onChange={(event) => setPauseReasons((current) => ({ ...current, [island]: event.target.value }))}
                      placeholder="Required to pause this island"
                      className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-900"
                    />
                  </label>
                ) : null}

                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold leading-5 text-slate-700">
                  <input
                    type="checkbox"
                    checked={attested[island]}
                    onChange={(event) => setAttested((current) => ({ ...current, [island]: event.target.checked }))}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    {live
                      ? "I attest that this pause is an authorized operating decision and the review reference is recorded."
                      : "I attest that I reviewed the live tariff, association, and eligible fleet evidence for this island."}
                  </span>
                </label>

                {live ? (
                  <button
                    type="button"
                    disabled={!canPause}
                    onClick={() => void changePilotStatus(island, "deactivate")}
                    className="mt-4 min-h-11 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-rose-800 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isBusy ? "Pausing…" : "Pause public beta"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canActivate}
                    onClick={() => void changePilotStatus(island, "activate")}
                    className="mt-4 min-h-11 w-full rounded-xl bg-[#043331] px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isBusy ? "Activating…" : blocked ? "Readiness required" : "Activate public beta"}
                  </button>
                )}

                {live && item.control.activationAuditId ? (
                  <p className="mt-3 break-all text-[10px] font-semibold text-slate-500">
                    Activation audit: {item.control.activationAuditId}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function GatePill({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 text-[9px] font-black uppercase ${ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
      {label}<span className="block mt-0.5">{ready ? "Ready" : "Hold"}</span>
    </div>
  );
}
