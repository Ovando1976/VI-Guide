"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import {
  DateRangeFilter,
  type DateRangeKey,
} from "@/components/date-range-filter";
import { isInDateRange } from "@/lib/date-range";

type SettlementStatus =
  | "pending_review"
  | "held"
  | "approved"
  | "paid"
  | "void"
  | "failed";

type PaymentMethod = "ach" | "bank_transfer" | "cash" | "check" | "other";

type SettlementRecord = {
  id: string;
  status: SettlementStatus;
  island: string;
  mode: string;
  driverId?: string | null;
  associationId?: string | null;
  origin: string;
  destination: string;
  grossFare: number;
  serviceFee: number;
  operatorSettlement: number;
  operatorSettlementCents: number;
  feeAgreementId?: string | null;
  holdReason?: string | null;
  reviewReference?: string | null;
  approvedBy?: string | null;
  approvedAt?: string;
  paidAmountCents?: number | null;
  externalPaymentReference?: string | null;
  externalPaymentMethod?: PaymentMethod | null;
  paymentNote?: string | null;
  paidBy?: string | null;
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SettlementPayload = {
  settlements?: SettlementRecord[];
  error?: string;
};

type PaymentDraft = {
  reference: string;
  method: PaymentMethod;
  note: string;
  attested: boolean;
};

const STATUS_OPTIONS: Array<{ value: "all" | SettlementStatus; label: string }> = [
  { value: "all", label: "All settlements" },
  { value: "pending_review", label: "Pending review" },
  { value: "held", label: "Held" },
  { value: "approved", label: "Approved / unpaid" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "void", label: "Void" },
];

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "ach", label: "ACH" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];

export function PayoutLedger() {
  const [range, setRange] = useState<DateRangeKey>("all");
  const [status, setStatus] = useState<"all" | SettlementStatus>("all");
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PaymentDraft>>({});
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load settlements.");
      }
      if (!payload) {
        throw new Error("Unable to load settlements.");
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

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const statusMatches = status === "all" || record.status === status;
        const date = record.completedAt || record.createdAt;
        return statusMatches && isInDateRange(date, range);
      }),
    [range, records, status],
  );

  const metrics = useMemo(() => {
    const pendingReview = records.filter(
      (record) => record.status === "pending_review",
    ).length;
    const held = records.filter((record) => record.status === "held").length;
    const approved = records.filter((record) => record.status === "approved");
    const paid = records.filter((record) => record.status === "paid");

    return {
      pendingReview,
      held,
      approvedCount: approved.length,
      approvedOutstanding: approved.reduce(
        (sum, record) => sum + record.operatorSettlement,
        0,
      ),
      paidCount: paid.length,
      paidTotal: paid.reduce(
        (sum, record) => sum + Number(record.paidAmountCents ?? 0) / 100,
        0,
      ),
      serviceFees: records.reduce((sum, record) => sum + record.serviceFee, 0),
    };
  }, [records]);

  async function recordPaid(record: SettlementRecord) {
    const draft = getDraft(drafts, record.id);
    try {
      setActiveAction(record.id);
      setMessage(null);
      setErrorMessage(null);

      const response = await fetch(
        `/api/admin/settlements/${encodeURIComponent(record.id)}/paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attested: draft.attested,
            paidAmountCents: record.operatorSettlementCents,
            externalPaymentReference: draft.reference,
            externalPaymentMethod: draft.method,
            paymentNote: draft.note,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to record settlement payment.");
      }

      setMessage(
        `Settlement ${record.id.slice(0, 12)} was recorded as paid. VI Guide recorded evidence only and did not move money.`,
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[record.id];
        return next;
      });
      await loadSettlements();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to record settlement payment.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <AdminShell
      eyebrow="Settlement Ledger"
      title="Operator obligations and payment evidence"
      description="Review calculated operator obligations, monitor holds, and record external payout evidence only after funds have already been delivered outside VI Guide."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter value={range} onChange={setRange} />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | SettlementStatus)
            }
            className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[.12em] text-[#043331]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => exportSettlementCsv(filtered)}
            disabled={!filtered.length}
            className="min-h-11 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <strong>Evidence ledger only.</strong> Recording a settlement as paid does not initiate an ACH, bank transfer, check, or cash payment. The action is available only after settlement approval and requires the exact approved amount, an external reference, a method, and an explicit attestation.
            </div>
          </div>
        </section>

        {message ? <Notice tone="success" text={message} /> : null}
        {errorMessage ? <Notice tone="error" text={errorMessage} /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Pending review" value={String(metrics.pendingReview)} />
          <Metric label="Held" value={String(metrics.held)} />
          <Metric label="Approved / unpaid" value={String(metrics.approvedCount)} />
          <Metric
            label="Outstanding obligation"
            value={money(metrics.approvedOutstanding)}
          />
          <Metric
            label="Recorded paid"
            value={`${metrics.paidCount} · ${money(metrics.paidTotal)}`}
          />
          <Metric label="Platform service fees" value={money(metrics.serviceFees)} />
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-teal-700">
                Governed settlement records
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[#043331]">
                {filtered.length} obligation{filtered.length === 1 ? "" : "s"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void loadSettlements()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : filtered.length ? (
            <div className="divide-y divide-slate-100">
              {filtered.map((record) => (
                <SettlementRow
                  key={record.id}
                  record={record}
                  draft={getDraft(drafts, record.id)}
                  active={activeAction === record.id}
                  actionLocked={activeAction !== null}
                  onDraft={(draft) =>
                    setDrafts((current) => ({ ...current, [record.id]: draft }))
                  }
                  onRecordPaid={() => void recordPaid(record)}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
                <div className="mt-4 text-lg font-black text-[#043331]">
                  No settlements match this view
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Change the status or date filter to review other obligations.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function SettlementRow({
  record,
  draft,
  active,
  actionLocked,
  onDraft,
  onRecordPaid,
}: {
  record: SettlementRecord;
  draft: PaymentDraft;
  active: boolean;
  actionLocked: boolean;
  onDraft: (draft: PaymentDraft) => void;
  onRecordPaid: () => void;
}) {
  const canSubmit =
    record.status === "approved" &&
    draft.attested &&
    draft.reference.trim().length >= 4 &&
    !actionLocked;

  return (
    <article className="p-5 sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={record.status} />
            <SmallBadge label={(record.island || "unknown").toUpperCase()} />
            <SmallBadge label={record.mode.replaceAll("_", " ")} />
            <span className="font-mono text-[9px] font-black text-slate-400">
              {record.id}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-black text-[#043331]">
            {record.origin} → {record.destination}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MoneyDatum label="Gross fare" value={record.grossFare} />
            <MoneyDatum label="Platform fee" value={record.serviceFee} />
            <MoneyDatum
              label="Operator obligation"
              value={record.operatorSettlement}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <span>Driver {record.driverId || "unassigned"}</span>
            <span>Completed {formatDate(record.completedAt)}</span>
            <span>Updated {formatDate(record.updatedAt)}</span>
          </div>

          {record.reviewReference ? (
            <Detail label="Approval review" value={record.reviewReference} />
          ) : null}
          {record.holdReason ? (
            <Detail label="Hold reason" value={record.holdReason} tone="warning" />
          ) : null}
          {record.status === "paid" ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
              <div className="font-black uppercase tracking-[.12em]">
                External payment recorded
              </div>
              <div className="mt-2 leading-5">
                {money(Number(record.paidAmountCents ?? 0) / 100)} · {methodLabel(record.externalPaymentMethod)} · {record.externalPaymentReference || "reference unavailable"}
              </div>
              <div className="mt-1 text-emerald-800/75">
                Recorded {formatDate(record.paidAt)} by {record.paidBy || "admin"}. VI Guide did not move these funds.
              </div>
            </div>
          ) : null}
        </div>

        {record.status === "approved" ? (
          <section className="rounded-[24px] border border-slate-200 bg-[#f8f4ea] p-4">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
              Record completed external payout
            </div>
            <div className="mt-2 text-sm font-black text-[#043331]">
              Exact amount: {money(record.operatorSettlement)}
            </div>

            <select
              value={draft.method}
              onChange={(event) =>
                onDraft({
                  ...draft,
                  method: event.target.value as PaymentMethod,
                })
              }
              className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <input
              value={draft.reference}
              onChange={(event) =>
                onDraft({ ...draft, reference: event.target.value.slice(0, 180) })
              }
              placeholder="Bank, ACH, check, or receipt reference"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"
            />
            <textarea
              value={draft.note}
              onChange={(event) =>
                onDraft({ ...draft, note: event.target.value.slice(0, 400) })
              }
              placeholder="Optional payment note"
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold"
            />
            <label className="mt-3 flex items-start gap-2 text-[11px] font-semibold leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={draft.attested}
                onChange={(event) =>
                  onDraft({ ...draft, attested: event.target.checked })
                }
                className="mt-1"
              />
              I attest that the full external payout was already completed and this action records evidence only.
            </label>
            <button
              type="button"
              onClick={onRecordPaid}
              disabled={!canSubmit}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {active ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Record payment evidence
            </button>
          </section>
        ) : (
          <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-600">
            {statusGuidance(record.status)}
          </section>
        )}
      </div>
    </article>
  );
}

function getDraft(
  drafts: Record<string, PaymentDraft>,
  bookingId: string,
): PaymentDraft {
  return (
    drafts[bookingId] ?? {
      reference: "",
      method: "bank_transfer",
      note: "",
      attested: false,
    }
  );
}

function exportSettlementCsv(rows: SettlementRecord[]) {
  const headers = [
    "booking_id",
    "status",
    "completed_at",
    "route",
    "island",
    "driver_id",
    "association_id",
    "gross_fare",
    "platform_service_fee",
    "operator_settlement",
    "review_reference",
    "external_payment_method",
    "external_payment_reference",
    "paid_amount",
    "paid_at",
  ];
  const values = rows.map((record) => [
    record.id,
    record.status,
    record.completedAt || "",
    `${record.origin} -> ${record.destination}`,
    record.island,
    record.driverId || "",
    record.associationId || "",
    record.grossFare.toFixed(2),
    record.serviceFee.toFixed(2),
    record.operatorSettlement.toFixed(2),
    record.reviewReference || "",
    record.externalPaymentMethod || "",
    record.externalPaymentReference || "",
    (Number(record.paidAmountCents ?? 0) / 100).toFixed(2),
    record.paidAt || "",
  ]);
  const csv = [headers, ...values]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "operator-settlement-ledger.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: SettlementStatus }) {
  const style =
    status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "approved"
        ? "border-teal-200 bg-teal-50 text-teal-800"
        : status === "held" || status === "failed"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[.14em] ${style}`}
    >
      {status.replaceAll("_", " ")}
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-[#043331]">{money(value)}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={`mt-3 rounded-2xl border p-3 text-xs font-semibold leading-5 ${
        tone === "warning"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="font-black">{label}:</span> {value}
    </div>
  );
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm font-semibold ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {text}
    </div>
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
  const time = Date.parse(value);
  if (Number.isNaN(time) || time <= 0) return "—";
  return new Date(time).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function methodLabel(method?: PaymentMethod | null) {
  return PAYMENT_METHODS.find((entry) => entry.value === method)?.label || "Other";
}

function statusGuidance(status: SettlementStatus) {
  switch (status) {
    case "pending_review":
      return "This obligation must pass the live financial review in Payment Operations before any payout evidence can be recorded.";
    case "held":
      return "This obligation is on hold. Resolve the hold and approve the settlement before recording payment evidence.";
    case "paid":
      return "External payment evidence is locked into the settlement audit trail.";
    case "failed":
      return "The settlement is marked failed and requires administrative review.";
    case "void":
      return "The settlement is void and is not payable.";
    default:
      return "This settlement is not currently actionable from the ledger.";
  }
}
