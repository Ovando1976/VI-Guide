"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  merchantAccessGrantedAt: string | null;
  followUpState: string;
  submittedAt: string;
  updatedAt: string;
};

type PipelineSummary = {
  total: number;
  active: number;
  unassigned: number;
  overdue: number;
  dueToday: number;
  scheduled: number;
  approved: number;
  converted: number;
  awaitingOnboarding: number;
  declined: number;
};

type PipelineFilter = "attention" | "mine" | "unassigned" | "active" | "all";
type PipelineAction =
  | "assign_to_me"
  | "unassign"
  | "schedule_follow_up"
  | "mark_contacted";

type ListPayload = {
  leads?: PipelineLead[];
  summary?: PipelineSummary;
  currentUserEmail?: string | null;
  canManage?: boolean;
  error?: string;
};

const EMPTY_SUMMARY: PipelineSummary = {
  total: 0,
  active: 0,
  unassigned: 0,
  overdue: 0,
  dueToday: 0,
  scheduled: 0,
  approved: 0,
  converted: 0,
  awaitingOnboarding: 0,
  declined: 0,
};

const FILTERS: Array<[PipelineFilter, string]> = [
  ["attention", "Needs attention"],
  ["mine", "Mine"],
  ["unassigned", "Unassigned"],
  ["active", "Active"],
  ["all", "All"],
];

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
      const payload = (await response.json().catch(() => null)) as ListPayload | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load the partner pipeline.");
      }
      const nextLeads = Array.isArray(payload?.leads) ? payload?.leads ?? [] : [];
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
  }, [load]);

  const visibleLeads = useMemo(() => {
    return leads.filter((lead) => {
      const active = !["approved", "declined"].includes(lead.status);
      if (filter === "all") return true;
      if (filter === "active") return active;
      if (filter === "unassigned") return active && !lead.assignedToEmail;
      if (filter === "mine") {
        return active && Boolean(currentUserEmail) && lead.assignedToEmail === currentUserEmail;
      }
      return (
        active &&
        (["overdue", "due_today", "unassigned"].includes(lead.followUpState) ||
          !lead.assignedToEmail)
      );
    });
  }, [currentUserEmail, filter, leads]);

  async function act(lead: PipelineLead, action: PipelineAction) {
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
          nextFollowUpDate:
            action === "schedule_follow_up" ? dateDrafts[lead.id] ?? "" : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { lead?: PipelineLead; error?: string }
        | null;
      const updated = payload?.lead;
      if (!response.ok || !updated) {
        throw new Error(payload?.error || "Unable to update the partner pipeline.");
      }
      setLeads((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`${updated.businessName} was updated.`);
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the partner pipeline.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
              Acquisition operations
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
              Partner follow-up queue
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Assign owners, schedule the next contact, and surface overdue partner leads.
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Active" value={summary.active} />
          <Metric label="Unassigned" value={summary.unassigned} />
          <Metric label="Overdue" value={summary.overdue} />
          <Metric label="Due today" value={summary.dueToday} />
          <Metric label="Awaiting onboarding" value={summary.awaitingOnboarding} />
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.12em] ${
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
            <div className="grid min-h-40 place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleLeads.length ? (
            <div className="rounded-2xl bg-emerald-50 p-6 text-center text-sm font-bold text-emerald-800">
              No partner leads match this queue.
            </div>
          ) : (
            visibleLeads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.13em] text-teal-700">
                      {lead.followUpState.replaceAll("_", " ")} · {lead.island}
                    </p>
                    <h3 className="mt-2 text-xl font-black">{lead.businessName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {lead.contactName} · {lead.email}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Owner: {lead.assignedToEmail || "Unassigned"}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">
                    {lead.status.replaceAll("_", " ")}
                  </span>
                </div>

                {canManage && !["approved", "declined"].includes(lead.status) ? (
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    {!lead.assignedToEmail ? (
                      <ActionButton
                        disabled={workingId === lead.id}
                        onClick={() => void act(lead, "assign_to_me")}
                      >
                        Assign to me
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={workingId === lead.id}
                        onClick={() => void act(lead, "unassign")}
                      >
                        Unassign
                      </ActionButton>
                    )}
                    <label className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">
                      Next follow-up
                      <input
                        type="date"
                        value={dateDrafts[lead.id] ?? ""}
                        onChange={(event) =>
                          setDateDrafts((current) => ({
                            ...current,
                            [lead.id]: event.target.value,
                          }))
                        }
                        className="mt-1 block min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
                      />
                    </label>
                    <ActionButton
                      disabled={workingId === lead.id || !dateDrafts[lead.id]}
                      onClick={() => void act(lead, "schedule_follow_up")}
                    >
                      Schedule
                    </ActionButton>
                    <ActionButton
                      disabled={workingId === lead.id}
                      onClick={() => void act(lead, "mark_contacted")}
                    >
                      Mark contacted
                    </ActionButton>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-10 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      {children}
    </div>
  );
}
