"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  UserMinus,
  UserRoundCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { humanizePartnerValue } from "@/lib/partners/partner-application";
import type { PartnerFollowUpState } from "@/lib/partners/partner-pipeline";

type PipelineLead = {
  id: string;
  reference: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  island: string;
  category: string;
  status: string;
  assignedToUid: string | null;
  assignedToEmail: string | null;
  assignedAt: string | null;
  nextFollowUpDate: string | null;
  lastContactedAt: string | null;
  lastContactedByEmail: string | null;
  followUpState: PartnerFollowUpState;
  submittedAt: string;
  updatedAt: string;
};

type PipelineSummary = {
  active: number;
  unassigned: number;
  overdue: number;
  dueToday: number;
  scheduled: number;
  unscheduled: number;
  contacted: number;
  closed: number;
};

type PipelineFilter =
  | "attention"
  | "mine"
  | "unassigned"
  | "overdue"
  | "due_today"
  | "active";

const EMPTY_SUMMARY: PipelineSummary = {
  active: 0,
  unassigned: 0,
  overdue: 0,
  dueToday: 0,
  scheduled: 0,
  unscheduled: 0,
  contacted: 0,
  closed: 0,
};

export function PartnerPipelineBoard() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [summary, setSummary] = useState<PipelineSummary>(EMPTY_SUMMARY);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [filter, setFilter] = useState<PipelineFilter>("attention");
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/partner-pipeline", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            leads?: PipelineLead[];
            summary?: PipelineSummary;
            currentUserEmail?: string | null;
            canManage?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load the partner pipeline.");
      }
      const nextLeads = Array.isArray(payload?.leads) ? payload.leads : [];
      setLeads(nextLeads);
      setSummary(payload?.summary ?? EMPTY_SUMMARY);
      setCurrentUserEmail(payload?.currentUserEmail ?? null);
      setCanManage(payload?.canManage === true);
      setDateDrafts((current) => ({
        ...Object.fromEntries(
          nextLeads.map((lead) => [
            lead.id,
            current[lead.id] ?? lead.nextFollowUpDate ?? "",
          ]),
        ),
      }));
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load the partner pipeline.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (["approved", "declined"].includes(lead.status)) return false;
      if (filter === "active") return true;
      if (filter === "mine") {
        return Boolean(
          currentUserEmail && lead.assignedToEmail === currentUserEmail,
        );
      }
      if (filter === "unassigned") return !lead.assignedToEmail;
      if (filter === "overdue") return lead.followUpState === "overdue";
      if (filter === "due_today") return lead.followUpState === "due_today";
      return (
        !lead.assignedToEmail ||
        lead.followUpState === "overdue" ||
        lead.followUpState === "due_today" ||
        lead.followUpState === "unscheduled"
      );
    });
  }, [currentUserEmail, filter, leads]);

  async function updateLead(
    lead: PipelineLead,
    action:
      | "assign_to_me"
      | "unassign"
      | "schedule_follow_up"
      | "clear_follow_up"
      | "mark_contacted",
  ) {
    if (!canManage) return;
    setWorkingId(lead.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/partner-pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          action,
          nextFollowUpDate: dateDrafts[lead.id] ?? "",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { lead?: PipelineLead; error?: string }
        | null;
      if (!response.ok || !payload?.lead) {
        throw new Error(payload?.error || "Unable to update the partner lead.");
      }
      setLeads((current) =>
        current.map((item) => (item.id === payload.lead?.id ? payload.lead : item)),
      );
      setDateDrafts((current) => ({
        ...current,
        [payload.lead.id]: payload.lead.nextFollowUpDate ?? "",
      }));
      setMessage(`${payload.lead.businessName} pipeline details were updated.`);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the partner lead.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
              Acquisition operating queue
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              Own every active partner lead
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Assign a responsible administrator, schedule the next contact, and
              record outreach so qualified USVI businesses do not disappear in an
              application inbox.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh pipeline
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Active" value={summary.active} />
          <Metric label="Unassigned" value={summary.unassigned} />
          <Metric label="Overdue" value={summary.overdue} tone="danger" />
          <Metric label="Due today" value={summary.dueToday} tone="warning" />
          <Metric label="Scheduled" value={summary.scheduled} />
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["attention", "Needs attention"],
              ["mine", "My leads"],
              ["unassigned", "Unassigned"],
              ["overdue", "Overdue"],
              ["due_today", "Due today"],
              ["active", "All active"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${
                filter === value
                  ? "bg-[#043331] text-white"
                  : "border border-slate-200 bg-white text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {loading && !leads.length ? (
            <div className="grid min-h-48 place-items-center rounded-[26px] bg-slate-50">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleLeads.length ? (
            <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-7 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-700" />
              <p className="mt-3 text-lg font-black">This pipeline queue is clear.</p>
            </div>
          ) : (
            visibleLeads.map((lead) => (
              <PipelineCard
                key={lead.id}
                lead={lead}
                dateDraft={dateDrafts[lead.id] ?? ""}
                today={today}
                canManage={canManage}
                currentUserEmail={currentUserEmail}
                working={workingId === lead.id}
                onDateChange={(value) =>
                  setDateDrafts((current) => ({ ...current, [lead.id]: value }))
                }
                onAction={(action) => void updateLead(lead, action)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function PipelineCard({
  lead,
  dateDraft,
  today,
  canManage,
  currentUserEmail,
  working,
  onDateChange,
  onAction,
}: {
  lead: PipelineLead;
  dateDraft: string;
  today: string;
  canManage: boolean;
  currentUserEmail: string | null;
  working: boolean;
  onDateChange: (value: string) => void;
  onAction: (
    action:
      | "assign_to_me"
      | "unassign"
      | "schedule_follow_up"
      | "clear_follow_up"
      | "mark_contacted",
  ) => void;
}) {
  const mine = Boolean(
    currentUserEmail && lead.assignedToEmail === currentUserEmail,
  );

  return (
    <article className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FollowUpBadge state={lead.followUpState} />
            <span className="rounded-full bg-white px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">
              {humanizePartnerValue(lead.status)}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-teal-700">
              {humanizePartnerValue(lead.island)}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black tracking-[-.03em]">
            {lead.businessName}
          </h3>
          <p className="mt-1 text-xs font-bold text-slate-400">
            {lead.reference} · {humanizePartnerValue(lead.category)}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
            Owner
          </p>
          <p className="mt-1 text-sm font-black">
            {lead.assignedToEmail || "Unassigned"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
        <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 hover:text-teal-700">
          <Mail className="h-4 w-4" /> {lead.contactName || lead.email}
        </a>
        {lead.phone ? (
          <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-2 hover:text-teal-700">
            <Phone className="h-4 w-4" /> {lead.phone}
          </a>
        ) : null}
        <span className="inline-flex items-center gap-2">
          <Clock3 className="h-4 w-4" /> Last contact {formatTime(lead.lastContactedAt)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
        <div className="flex flex-wrap gap-2">
          {canManage && !mine ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onAction("assign_to_me")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
            >
              <UserRoundCheck className="h-4 w-4" /> Assign to me
            </button>
          ) : null}
          {canManage && lead.assignedToEmail ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onAction("unassign")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50"
            >
              <UserMinus className="h-4 w-4" /> Unassign
            </button>
          ) : null}
          {canManage ? (
            <button
              type="button"
              disabled={working}
              onClick={() => onAction("mark_contacted")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark contacted
            </button>
          ) : null}
        </div>

        <label className="block text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
          Next follow-up date
          <input
            type="date"
            min={today}
            value={dateDraft}
            disabled={!canManage || working}
            onChange={(event) => onDateChange(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#043331] outline-none focus:border-teal-600 disabled:opacity-60"
          />
        </label>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={working || !dateDraft}
              onClick={() => onAction("schedule_follow_up")}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              Schedule
            </button>
            {lead.nextFollowUpDate ? (
              <button
                type="button"
                disabled={working}
                onClick={() => onAction("clear_follow_up")}
                className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
}) {
  const style =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] opacity-60">
        {label}
      </p>
    </div>
  );
}

function FollowUpBadge({ state }: { state: PartnerFollowUpState }) {
  const styles: Record<PartnerFollowUpState, string> = {
    closed: "bg-slate-200 text-slate-700",
    overdue: "bg-rose-100 text-rose-800",
    due_today: "bg-amber-100 text-amber-900",
    scheduled: "bg-emerald-100 text-emerald-800",
    unscheduled: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[state]}`}>
      {state === "overdue" ? <AlertTriangle className="h-3 w-3" /> : null}
      {humanizePartnerValue(state)}
    </span>
  );
}

function formatTime(value: string | null) {
  if (!value) return "not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "not recorded";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
