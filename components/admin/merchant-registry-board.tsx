"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Search,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MERCHANT_ACQUISITION_STAGES,
  humanizeMerchantValue,
  merchantStageIndex,
  type MerchantAcquisitionStage,
  type MerchantRegistryStatus,
} from "@/lib/partners/merchant-registry";

type MerchantRecord = {
  id: string;
  canonicalKey: string;
  businessName: string;
  island: string;
  category: string;
  stage: MerchantAcquisitionStage;
  status: MerchantRegistryStatus;
  sourceKinds: string[];
  sourceRecordIds: string[];
  sourceUrls: string[];
  website: string | null;
  phone: string | null;
  location: string | null;
  assignedToUid: string | null;
  assignedToEmail: string | null;
  nextFollowUpDate: string | null;
  lastContactedAt: string | null;
  internalNote: string | null;
  catalogUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

type RegistrySummary = {
  total: number;
  active: number;
  paused: number;
  doNotContact: number;
  closed: number;
  unassigned: number;
  overdue: number;
  dueToday: number;
  scheduled: number;
  unscheduled: number;
  stages: Record<MerchantAcquisitionStage, number>;
};

type Filter = MerchantAcquisitionStage | "all";

const EMPTY_SUMMARY: RegistrySummary = {
  total: 0,
  active: 0,
  paused: 0,
  doNotContact: 0,
  closed: 0,
  unassigned: 0,
  overdue: 0,
  dueToday: 0,
  scheduled: 0,
  unscheduled: 0,
  stages: Object.fromEntries(
    MERCHANT_ACQUISITION_STAGES.map((stage) => [stage, 0]),
  ) as Record<MerchantAcquisitionStage, number>,
};

export function MerchantRegistryBoard() {
  const [records, setRecords] = useState<MerchantRecord[]>([]);
  const [summary, setSummary] = useState<RegistrySummary>(EMPTY_SUMMARY);
  const [canManageStage, setCanManageStage] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [island, setIsland] = useState("all");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/merchant-registry", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            records?: MerchantRecord[];
            summary?: RegistrySummary;
            canManageStage?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load merchant registry.");
      }
      const nextRecords = Array.isArray(payload?.records) ? payload?.records ?? [] : [];
      setRecords(nextRecords);
      setSummary(payload?.summary ?? EMPTY_SUMMARY);
      setCanManageStage(payload?.canManageStage === true);
      setNotes(
        Object.fromEntries(
          nextRecords.map((record) => [record.id, record.internalNote ?? ""]),
        ),
      );
      setFollowUps(
        Object.fromEntries(
          nextRecords.map((record) => [record.id, record.nextFollowUpDate ?? ""]),
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load merchant registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (filter !== "all" && record.stage !== filter) return false;
      if (island !== "all" && record.island !== island) return false;
      if (!needle) return true;
      return [
        record.businessName,
        record.category,
        record.location ?? "",
        record.phone ?? "",
        record.website ?? "",
        record.assignedToEmail ?? "",
        ...record.sourceKinds,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [filter, island, query, records]);

  async function bootstrap() {
    if (!canManageStage) return;
    setBootstrapping(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/merchant-registry/bootstrap", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            candidateCount?: number;
            created?: number;
            refreshed?: number;
            reconciledClaims?: number;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to refresh the audited catalog.");
      }
      setMessage(
        `Catalog synced: ${payload?.candidateCount ?? 0} businesses, ${payload?.created ?? 0} new, ${payload?.reconciledClaims ?? 0} claim-stage reconciliations.`,
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to refresh the audited catalog.");
    } finally {
      setBootstrapping(false);
    }
  }

  async function act(
    record: MerchantRecord,
    action: string,
    extra: Record<string, unknown> = {},
  ) {
    setWorkingId(record.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/merchant-registry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, action, ...extra }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { record?: MerchantRecord; error?: string }
        | null;
      if (!response.ok || !payload?.record) {
        throw new Error(payload?.error || "Unable to update merchant record.");
      }
      setMessage(`${payload.record.businessName} updated.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update merchant record.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
          >
            Admin
          </Link>
          <div className="flex flex-wrap gap-2">
            {canManageStage ? (
              <button
                type="button"
                disabled={bootstrapping}
                onClick={() => void bootstrap()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
              >
                {bootstrapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                Sync audited catalog
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Refresh
            </button>
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.22),transparent_30%),linear-gradient(145deg,#032f2d,#07504c)] p-7 text-white shadow-xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
            Merchant acquisition CRM
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-6xl">
            Turn the USVI business universe into an operating pipeline.
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/66 sm:text-base">
            One record follows each business from discovery to profile, outreach, claim, verification, connected booking, and recorded revenue. Public listings never grant privileges by themselves.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {MERCHANT_ACQUISITION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setFilter(filter === stage ? "all" : stage)}
              className={`rounded-[22px] border p-4 text-left shadow-sm transition ${
                filter === stage
                  ? "border-[#043331] bg-[#043331] text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className={`text-[8px] font-black uppercase tracking-[.13em] ${filter === stage ? "text-[#8ef0e7]" : "text-slate-400"}`}>
                {humanizeMerchantValue(stage)}
              </p>
              <p className="mt-2 text-3xl font-black">{summary.stages[stage]}</p>
            </button>
          ))}
        </section>

        <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total businesses" value={summary.total} />
          <Metric label="Unassigned" value={summary.unassigned} />
          <Metric label="Follow-up overdue" value={summary.overdue} />
          <Metric label="Due today" value={summary.dueToday} />
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search business, category, location, owner, phone, or website"
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600"
              />
            </label>
            <select
              value={island}
              onChange={(event) => setIsland(event.target.value)}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-600"
            >
              <option value="all">All islands</option>
              <option value="stt">St. Thomas</option>
              <option value="stj">St. John</option>
              <option value="stx">St. Croix</option>
              <option value="wi">Water Island</option>
            </select>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Showing {visibleRecords.length} of {records.length} registry records.
          </p>
        </section>

        <section className="mt-5 space-y-4">
          {loading && !records.length ? (
            <div className="grid min-h-56 place-items-center rounded-[28px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleRecords.length ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching merchant records</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-900/65">
                {records.length
                  ? "Change the filters to widen the view."
                  : canManageStage
                    ? "Sync the audited catalog to create the first registry snapshot."
                    : "An administrator must sync the audited catalog first."}
              </p>
            </div>
          ) : (
            visibleRecords.map((record) => (
              <MerchantCard
                key={record.id}
                record={record}
                canManageStage={canManageStage}
                note={notes[record.id] ?? ""}
                followUp={followUps[record.id] ?? ""}
                working={workingId === record.id}
                onNote={(value) =>
                  setNotes((current) => ({ ...current, [record.id]: value }))
                }
                onFollowUp={(value) =>
                  setFollowUps((current) => ({ ...current, [record.id]: value }))
                }
                onAction={(action, extra) => void act(record, action, extra)}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function MerchantCard({
  record,
  canManageStage,
  note,
  followUp,
  working,
  onNote,
  onFollowUp,
  onAction,
}: {
  record: MerchantRecord;
  canManageStage: boolean;
  note: string;
  followUp: string;
  working: boolean;
  onNote: (value: string) => void;
  onFollowUp: (value: string) => void;
  onAction: (action: string, extra?: Record<string, unknown>) => void;
}) {
  const nextStages = MERCHANT_ACQUISITION_STAGES.filter(
    (stage) => merchantStageIndex(stage) > merchantStageIndex(record.stage),
  );

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Pill>{humanizeMerchantValue(record.stage)}</Pill>
            <Pill>{humanizeMerchantValue(record.island)}</Pill>
            <Pill>{humanizeMerchantValue(record.status)}</Pill>
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-[-.04em]">{record.businessName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{record.category}</p>
          {record.location ? <p className="mt-1 text-xs font-semibold text-slate-400">{record.location}</p> : null}
        </div>
        <div className="text-right text-[10px] font-bold text-slate-400">
          <p>{record.assignedToEmail ? `Owner: ${record.assignedToEmail}` : "Unassigned"}</p>
          <p className="mt-1">{record.sourceKinds.map(humanizeMerchantValue).join(" · ")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dl className="space-y-3 text-xs">
            <Info label="Phone" value={record.phone || "Not in catalog"} />
            <Info label="Website" value={record.website || "Not in catalog"} />
            <Info label="Last contacted" value={formatDateTime(record.lastContactedAt)} />
            <Info label="Next follow-up" value={record.nextFollowUpDate || "Not scheduled"} />
          </dl>
          {record.website ? (
            <a
              href={record.website}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex text-[9px] font-black uppercase tracking-[.13em] text-teal-700 underline"
            >
              Open business site
            </a>
          ) : null}
        </div>

        <div>
          <textarea
            value={note}
            onChange={(event) => onNote(event.target.value)}
            maxLength={2400}
            rows={4}
            placeholder="Internal CRM note"
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-teal-600"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton disabled={working} onClick={() => onAction("save_note", { note })}>
              Save note
            </ActionButton>
            {record.assignedToEmail ? (
              <ActionButton disabled={working} onClick={() => onAction("unassign")}>
                Unassign
              </ActionButton>
            ) : (
              <ActionButton disabled={working} onClick={() => onAction("assign_to_me")}>
                <UserRoundCheck className="h-3.5 w-3.5" /> Claim lead
              </ActionButton>
            )}
            <ActionButton disabled={working} onClick={() => onAction("mark_contacted")}>
              Mark contacted
            </ActionButton>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <CalendarClock className="h-4 w-4 text-teal-700" />
            <input
              type="date"
              value={followUp}
              onChange={(event) => onFollowUp(event.target.value)}
              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"
            />
            <ActionButton
              disabled={working || !followUp}
              onClick={() => onAction("schedule_follow_up", { nextFollowUpDate: followUp })}
            >
              Schedule
            </ActionButton>
            {record.nextFollowUpDate ? (
              <ActionButton disabled={working} onClick={() => onAction("clear_follow_up")}>
                Clear
              </ActionButton>
            ) : null}
          </div>

          {canManageStage ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-500">
                Advance lifecycle
                <select
                  value=""
                  disabled={working || !nextStages.length}
                  onChange={(event) => {
                    if (event.target.value) {
                      onAction("advance_stage", { stage: event.target.value });
                    }
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold normal-case tracking-normal"
                >
                  <option value="">{nextStages.length ? "Choose next stage" : "Lifecycle complete"}</option>
                  {nextStages.map((stage) => (
                    <option key={stage} value={stage}>{humanizeMerchantValue(stage)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-500">
                Registry status
                <select
                  value={record.status}
                  disabled={working}
                  onChange={(event) => onAction("set_status", { status: event.target.value })}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold normal-case tracking-normal"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="do_not_contact">Do not contact</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-teal-800">
      {children}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-black uppercase tracking-[.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#043331] px-4 text-[8px] font-black uppercase tracking-[.12em] text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-bold ${tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      {children}
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "Not contacted";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : value;
}
