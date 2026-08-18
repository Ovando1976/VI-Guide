"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  ShieldCheck,
} from "lucide-react";

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
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [report, setReport] = useState<AuditPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bridgeMessage, setBridgeMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function downloadAudit(format: "csv" | "json") {
    setBridgeBusy(true);
    setBridgeMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/admin/taxi-tariffs/audit/bridge?format=${format}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to export tariff audit.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename =
        filenameMatch?.[1] ??
        `usvi-taxi-tariff-audit-${new Date().toISOString().slice(0, 10)}.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setBridgeMessage(
        `${format.toUpperCase()} audit exported. Add reviewDecision values offline, then import the reviewed file.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to export tariff audit.",
      );
    } finally {
      setBridgeBusy(false);
    }
  }

  async function importAudit(file: File) {
    setBridgeBusy(true);
    setBridgeMessage(null);
    setErrorMessage(null);
    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const response = await fetch("/api/admin/taxi-tariffs/audit/bridge", {
        method: "POST",
        headers: {
          "Content-Type": isCsv ? "text/csv; charset=utf-8" : "application/json",
        },
        body: await file.text(),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to import tariff audit reviews.");
      }
      setBridgeMessage(
        `${payload.imported ?? 0} reviewed route decisions imported. No fares or activation state were changed.`,
      );
      await runAudit();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to import tariff audit reviews.",
      );
    } finally {
      setBridgeBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          disabled={loading || bridgeBusy}
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

      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-800">
          Bulk audit bridge
        </div>
        <div className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          Export every production route to CSV or JSON, review the rows offline, then import only the review decisions. Imports write a separate audit-review record and never change fares, route rules, activation state, or quote behavior.
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadAudit("csv")}
            disabled={bridgeBusy}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-teal-950 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void downloadAudit("json")}
            disabled={bridgeBusy}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-teal-950 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={bridgeBusy}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
          >
            {bridgeBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Import reviews
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importAudit(file);
            }}
          />
        </div>
        {bridgeMessage ? (
          <div className="mt-3 text-xs font-bold leading-5 text-teal-900">{bridgeMessage}</div>
        ) : null}
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
