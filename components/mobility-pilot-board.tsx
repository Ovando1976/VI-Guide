"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleOff,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import type {
  MobilityPilotControl,
  MobilityPilotGateReport,
} from "@/types/mobility-pilot";
import type { IslandCode } from "@/types/usvi";

type PilotIslandRecord = {
  island: IslandCode;
  control: MobilityPilotControl;
  report: MobilityPilotGateReport;
  effectiveActive: boolean;
  activationIssue?: string;
};

type PendingAction = {
  island: IslandCode;
  type: "activate" | "deactivate";
};

export function MobilityPilotBoard() {
  const [islands, setIslands] = useState<PilotIslandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReadiness = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/admin/mobility-pilot", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load pilot readiness.");
      }
      setIslands(Array.isArray(payload?.islands) ? payload.islands : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load pilot readiness.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReadiness();
  }, [loadReadiness]);

  const metrics = useMemo(() => {
    const active = islands.filter((item) => item.effectiveActive).length;
    const blocked = islands.filter(
      (item) =>
        !item.report.ready ||
        (item.control.status === "active" && !item.effectiveActive),
    ).length;
    const awaitingApproval = islands.filter(
      (item) => item.report.ready && !item.effectiveActive,
    ).length;
    return { active, blocked, awaitingApproval };
  }, [islands]);

  async function applyAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingAction) return;

    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `/api/admin/mobility-pilot/${pendingAction.island}/${pendingAction.type}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attested: form.get("attested") === "on",
            reviewReference: form.get("reviewReference"),
            ...(pendingAction.type === "deactivate"
              ? { reason: form.get("reason") }
              : {}),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const gateIssues = payload?.report
          ? reportIssues(payload.report as MobilityPilotGateReport).join(" ")
          : "";
        throw new Error(
          `${payload?.error ?? "Pilot action failed."}${gateIssues ? ` ${gateIssues}` : ""}`,
        );
      }

      setMessage(
        pendingAction.type === "activate"
          ? `${islandLabel(pendingAction.island)} pilot activated. Quotes and bookings now remain available only while every live gate continues to pass.`
          : `${islandLabel(pendingAction.island)} pilot deactivated. Quotes and new bookings are closed immediately.`,
      );
      setPendingAction(null);
      await loadReadiness();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Pilot action failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selected = pendingAction
    ? islands.find((item) => item.island === pendingAction.island) ?? null
    : null;

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#032d2b,#075e58)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.18)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#f7d778]">
                Controlled launch authority
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
                Mobility pilot readiness
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                A valid tariff does not turn booking on by itself. Each island
                requires an explicit reviewed activation, and every quote and
                booking re-checks the active tariff, association, driver, vehicle,
                inspection, insurance, credentials, and activation evidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/tariffs"
                className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
              >
                Tariff governance
              </Link>
              <Link
                href="/admin/taxi-operations"
                className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00]"
              >
                Taxi operations
              </Link>
            </div>
          </div>
        </section>

        {message ? <Notice tone="success" text={message} /> : null}
        {errorMessage ? <Notice tone="error" text={errorMessage} /> : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Live pilots"
            value={metrics.active}
            note="server verified"
          />
          <Metric
            label="Awaiting approval"
            value={metrics.awaitingApproval}
            note="ready or reactivation needed"
          />
          <Metric
            label="Blocked"
            value={metrics.blocked}
            note="gate or evidence action required"
          />
        </section>

        {loading ? (
          <section className="grid min-h-72 place-items-center rounded-[30px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-3">
            {islands.map((item) => (
              <IslandReadinessCard
                key={item.island}
                item={item}
                onAction={(type) =>
                  setPendingAction({ island: item.island, type })
                }
              />
            ))}
          </section>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadReadiness()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh live gates
          </button>
        </div>

        {pendingAction && selected ? (
          <ActionPanel
            action={pendingAction}
            item={selected}
            submitting={submitting}
            onCancel={() => setPendingAction(null)}
            onSubmit={applyAction}
          />
        ) : null}
      </div>
    </main>
  );
}

function IslandReadinessCard({
  item,
  onAction,
}: {
  item: PilotIslandRecord;
  onAction: (type: PendingAction["type"]) => void;
}) {
  const live = item.effectiveActive;
  const activeButBlocked = item.control.status === "active" && !live;
  const issues = [
    ...reportIssues(item.report),
    ...(item.activationIssue ? [item.activationIssue] : []),
  ];

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.17em] text-slate-400">
            Island pilot
          </div>
          <h2 className="mt-2 text-2xl font-black">
            {islandLabel(item.island)}
          </h2>
        </div>
        <StatusBadge live={live} blocked={activeButBlocked} />
      </div>

      <div className="mt-5 space-y-3">
        <GateRow
          label="Official tariff"
          ready={item.report.tariff.ready}
          detail={
            item.report.tariff.ready
              ? `Version ${item.report.tariff.version}`
              : item.report.tariff.issue
          }
        />
        <GateRow
          label="Reviewed association"
          ready={item.report.association.ready}
          detail={
            item.report.association.ready
              ? `${item.report.association.associationIds.length} active`
              : item.report.association.issue
          }
        />
        <GateRow
          label="Credentialed fleet"
          ready={item.report.fleet.ready}
          detail={
            item.report.fleet.ready
              ? `${item.report.fleet.eligiblePairs.length} eligible pair${item.report.fleet.eligiblePairs.length === 1 ? "" : "s"}`
              : item.report.fleet.issue
          }
        />
        <GateRow
          label="Activation evidence"
          ready={live}
          detail={
            live
              ? `Verified audit ${item.control.activationAuditId}`
              : item.activationIssue || "Reviewed activation is required."
          }
        />
      </div>

      {issues.length ? (
        <div className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
          {Array.from(new Set(issues)).join(" ")}
        </div>
      ) : null}

      <div className="mt-5 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        Last checked {formatDateTime(item.report.checkedAt)}
      </div>

      <div className="mt-5 flex gap-2">
        {live ? (
          <button
            type="button"
            onClick={() => onAction("deactivate")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-rose-800"
          >
            <Power className="h-4 w-4" /> Kill switch
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction("activate")}
            disabled={!item.report.ready}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ShieldCheck className="h-4 w-4" />
            {item.control.status === "active" ? "Review & reactivate" : "Activate"}
          </button>
        )}
      </div>
    </article>
  );
}

function GateRow({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-[#f8f4ea] p-4">
      {ready ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
      ) : (
        <CircleOff className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
      )}
      <div>
        <div className="text-sm font-black">{label}</div>
        <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {detail || (ready ? "Ready" : "Action required")}
        </div>
      </div>
    </div>
  );
}

function ActionPanel({
  action,
  item,
  submitting,
  onCancel,
  onSubmit,
}: {
  action: PendingAction;
  item: PilotIslandRecord;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const activating = action.type === "activate";
  return (
    <section
      className={`rounded-[30px] border p-6 shadow-sm ${
        activating
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-600">
        Reviewed launch action
      </div>
      <h2 className="mt-2 text-2xl font-black">
        {activating ? "Activate" : "Deactivate"} {islandLabel(item.island)}
      </h2>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        {activating
          ? "This creates new audit evidence and enables public quotes and bookings only while the exact approved tariff and all live operator gates remain valid."
          : "This immediately closes public quotes and new bookings without deleting existing trip or audit records."}
      </p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field
          label={`${activating ? "Activation" : "Deactivation"} review reference`}
          name="reviewReference"
        />
        {!activating ? (
          <Field label="Deactivation reason" name="reason" />
        ) : null}
        <label className="flex items-start gap-3 rounded-[20px] border border-white/80 bg-white/75 p-4 text-xs font-semibold leading-5">
          <input
            type="checkbox"
            name="attested"
            required
            className="mt-0.5 h-4 w-4 accent-[#0f766e]"
          />
          <span>
            I reviewed this island’s live tariff, association, driver, vehicle,
            inspection, insurance, credential, provenance, and activation status
            and understand the customer-booking impact of this action.
          </span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[.14em]"
          >
            Cancel
          </button>
          <button
            disabled={submitting || (activating && !item.report.ready)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-40 ${
              activating ? "bg-emerald-800" : "bg-rose-800"
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : activating ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Confirm {action.type}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
        {label}
      </span>
      <input
        name={name}
        required
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-400">{note}</div>
    </div>
  );
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  const success = tone === "success";
  return (
    <section
      className={`flex items-start gap-3 rounded-[24px] border p-5 ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <p className="text-sm font-semibold">{text}</p>
    </section>
  );
}

function StatusBadge({ live, blocked }: { live: boolean; blocked: boolean }) {
  const label = live ? "Live" : blocked ? "Auto-paused" : "Inactive";
  const classes = live
    ? "bg-emerald-100 text-emerald-800"
    : blocked
      ? "bg-rose-100 text-rose-800"
      : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] ${classes}`}
    >
      {label}
    </span>
  );
}

function reportIssues(report: MobilityPilotGateReport) {
  return [report.tariff.issue, report.association.issue, report.fleet.issue].filter(
    (value): value is string => Boolean(value),
  );
}

function islandLabel(island: IslandCode) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function formatDateTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
