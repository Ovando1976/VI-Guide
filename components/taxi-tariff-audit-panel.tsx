"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type IslandSummary = {
  tariffCount: number;
  ruleCount: number;
  blockingFindings: number;
  statuses: Record<string, number>;
};

type AuditPayload = {
  ok: boolean;
  generatedAt: string;
  tariffCount: number;
  ruleCount: number;
  blockingFindings: number;
  byIsland: Record<string, IslandSummary>;
  blocking: Array<{
    tariffId: string | null;
    island: string;
    ruleId: string;
    status: string;
    reason?: string;
    conflictsWith?: string;
  }>;
};

export function TaxiTariffAuditPanel() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runAudit() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/admin/taxi-tariffs/audit", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to run tariff route audit.");
      }
      setReport(payload as AuditPayload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to run tariff route audit.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-6 max-w-7xl rounded-[30px] border border-slate-200 bg-white p-5 text-[#043331] shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
            Production safety gate
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
            Audit every taxi tariff route
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Reads production tariff records without modifying them, checks route provenance,
            endpoint identity, passenger pricing, and duplicate fare conflicts, then reports
            any route that must remain fail-closed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runAudit()}
          disabled={loading}
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Run production audit
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
          {errorMessage}
        </div>
      ) : null}

      {report ? (
        <div className="mt-6 space-y-5">
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 ${
              report.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {report.ok ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div className="text-sm font-semibold leading-6">
              <div className="font-black">
                {report.ruleCount} rules inspected across {report.tariffCount} tariff records.
              </div>
              <div>
                {report.blockingFindings === 0
                  ? "No blocking route findings."
                  : `${report.blockingFindings} route finding(s) must remain non-quoteable until reviewed.`}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(report.byIsland).map(([island, summary]) => (
              <div key={island} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
                  {islandLabel(island)}
                </div>
                <div className="mt-2 text-2xl font-black">{summary.ruleCount} rules</div>
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  {summary.blockingFindings} blocking · {summary.statuses.official_verified ?? 0} canonical · {summary.statuses.alias_verified ?? 0} alias
                </div>
              </div>
            ))}
          </div>

          {report.blocking.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
                Blocking route findings
              </div>
              <div className="max-h-[420px] overflow-auto divide-y divide-slate-100">
                {report.blocking.map((finding, index) => (
                  <div key={`${finding.tariffId}-${finding.ruleId}-${index}`} className="px-4 py-3 text-sm">
                    <div className="font-black text-[#043331]">
                      {islandLabel(finding.island)} · {finding.ruleId}
                    </div>
                    <div className="mt-1 font-semibold text-slate-600">
                      {finding.reason ?? finding.status}
                      {finding.conflictsWith ? ` · conflicts with ${finding.conflictsWith}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function islandLabel(island: string) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return island;
}
