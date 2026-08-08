"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";

type SettlementRecord = {
  id: string;
  status: string;
  island: string;
  mode: string;
  driverId?: string | null;
  origin: string;
  destination: string;
  grossFare: number;
  serviceFee: number;
  operatorSettlement: number;
  paidAmountCents?: number | null;
  externalPaymentReference?: string | null;
  externalPaymentMethod?: string | null;
  paidAt?: string;
  completedAt?: string;
  updatedAt: string;
};

type SettlementPayload = {
  settlements?: SettlementRecord[];
  error?: string;
};

export function DispatcherSettlementLedger() {
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/admin/settlements", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | SettlementPayload
        | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to load settlements.");
      }
      setRecords(Array.isArray(payload.settlements) ? payload.settlements : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load settlements.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const metrics = useMemo(() => {
    const approved = records.filter((record) => record.status === "approved");
    const paid = records.filter((record) => record.status === "paid");
    return {
      pending: records.filter((record) => record.status === "pending_review").length,
      held: records.filter((record) => record.status === "held").length,
      approved: approved.length,
      outstanding: approved.reduce(
        (sum, record) => sum + Number(record.operatorSettlement || 0),
        0,
      ),
      paid: paid.length,
    };
  }, [records]);

  return (
    <AdminShell
      eyebrow="Settlement Ledger · Dispatcher"
      title="Settlement review"
      description="Inspect operator obligations, holds, approvals, and recorded payout evidence without changing financial state."
      actions={
        <button
          type="button"
          onClick={() => void loadSettlements()}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      }
    >
      <div className="space-y-7">
        <section className="rounded-[28px] border border-sky-200 bg-sky-50 p-5 text-sm font-semibold leading-6 text-sky-950">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <strong>Read-only dispatcher access.</strong> You can review settlement status and existing payment evidence. Only an administrator can record an external payout as paid or otherwise change financial settlement state.
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Pending review" value={String(metrics.pending)} />
          <Metric label="Held" value={String(metrics.held)} />
          <Metric label="Approved / unpaid" value={String(metrics.approved)} />
          <Metric label="Outstanding" value={money(metrics.outstanding)} />
          <Metric label="Recorded paid" value={String(metrics.paid)} />
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-teal-700">
              Governed settlement records
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">
              {records.length} obligation{records.length === 1 ? "" : "s"}
            </h2>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : records.length ? (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <article key={record.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={record.status} />
                        <SmallBadge label={(record.island || "unknown").toUpperCase()} />
                        <SmallBadge label={(record.mode || "trip").replaceAll("_", " ")} />
                      </div>
                      <h3 className="mt-3 text-lg font-black text-[#043331]">
                        {record.origin} → {record.destination}
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                        <span>Driver {record.driverId || "unassigned"}</span>
                        <span>Completed {formatDate(record.completedAt)}</span>
                        <span>Updated {formatDate(record.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="grid min-w-[min(100%,22rem)] gap-3 sm:grid-cols-3">
                      <MoneyDatum label="Gross" value={record.grossFare} />
                      <MoneyDatum label="Platform fee" value={record.serviceFee} />
                      <MoneyDatum label="Operator" value={record.operatorSettlement} />
                    </div>
                  </div>

                  {record.status === "paid" ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-900">
                      <div className="font-black uppercase tracking-[.12em]">
                        External payment recorded
                      </div>
                      <div className="mt-2">
                        {money(Number(record.paidAmountCents ?? 0) / 100)} · {record.externalPaymentMethod || "method unavailable"} · {record.externalPaymentReference || "reference unavailable"}
                      </div>
                      <div className="mt-1 text-emerald-800/75">
                        Recorded {formatDate(record.paidAt)}. VI Guide did not move these funds.
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
                <div className="mt-4 text-lg font-black text-[#043331]">
                  No settlement records to review
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-xl font-black tracking-tight text-[#043331]">
        {value}
      </div>
    </div>
  );
}

function MoneyDatum({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-[#043331]">{money(value)}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "approved"
        ? "border-teal-200 bg-teal-50 text-teal-800"
        : status === "held" || status === "failed"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] ${style}`}>
      {(status || "unknown").replaceAll("_", " ")}
    </span>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">
      {label}
    </span>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
