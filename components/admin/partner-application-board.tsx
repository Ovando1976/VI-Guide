"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  canTransitionPartnerApplication,
  humanizePartnerValue,
  type PartnerApplicationStatus,
} from "@/lib/partners/partner-application";

type Application = {
  id: string;
  reference: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  island: string;
  category: string;
  website: string | null;
  existingListingId: string | null;
  services: string;
  goals: string | null;
  interests: string[];
  referralSource: string | null;
  status: PartnerApplicationStatus;
  adminNote: string | null;
  reviewedAt: string | null;
  reviewedByEmail: string | null;
  submittedAt: string;
  updatedAt: string;
};

type Counts = {
  total: number;
  new: number;
  reviewing: number;
  needsInformation: number;
  approved: number;
  declined: number;
};

type Filter = PartnerApplicationStatus | "active" | "all";

const EMPTY_COUNTS: Counts = {
  total: 0,
  new: 0,
  reviewing: 0,
  needsInformation: 0,
  approved: 0,
  declined: 0,
};

const STATUS_ACTIONS: PartnerApplicationStatus[] = [
  "reviewing",
  "needs_information",
  "approved",
  "declined",
];

export function PartnerApplicationBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [canManage, setCanManage] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/partner-applications", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            applications?: Application[];
            counts?: Counts;
            canManage?: boolean;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load partner applications.");
      }
      const nextApplications = Array.isArray(payload?.applications)
        ? payload.applications
        : [];
      setApplications(nextApplications);
      setCounts(payload?.counts ?? EMPTY_COUNTS);
      setCanManage(payload?.canManage === true);
      setNotes(
        Object.fromEntries(
          nextApplications.map((application) => [
            application.id,
            application.adminNote ?? "",
          ]),
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load partner applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const statusMatch =
        filter === "all"
          ? true
          : filter === "active"
            ? ["new", "reviewing", "needs_information"].includes(
                application.status,
              )
            : application.status === filter;
      if (!statusMatch) return false;
      if (!normalizedQuery) return true;
      return [
        application.businessName,
        application.contactName,
        application.email,
        application.reference,
        application.existingListingId ?? "",
        application.island,
        application.category,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [applications, filter, query]);

  async function updateApplication(
    application: Application,
    status: PartnerApplicationStatus,
  ) {
    if (!canManage) return;
    setWorkingId(application.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/partner-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: application.id,
          status,
          adminNote: notes[application.id] ?? "",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { application?: Application; error?: string }
        | null;
      if (!response.ok || !payload?.application) {
        throw new Error(payload?.error || "Unable to update the application.");
      }
      setApplications((current) =>
        current.map((item) =>
          item.id === payload.application?.id ? payload.application : item,
        ),
      );
      setMessage(
        `${payload.application.businessName} is now ${humanizePartnerValue(
          payload.application.status,
        ).toLowerCase()}.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the application.",
      );
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
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
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
            Refresh
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_35%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Merchant acquisition
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Partner application review
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Verify island businesses, document the review decision, and hand
                approved applicants to listing-scoped merchant onboarding.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
              <ShieldCheck className="h-6 w-6 text-[#f5c451]" />
              <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                Current access
              </p>
              <p className="mt-1 text-xl font-black">
                {canManage ? "Admin review controls" : "Read-only review"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Building2} label="New" value={counts.new} />
          <Metric icon={Clock3} label="Reviewing" value={counts.reviewing} />
          <Metric
            icon={AlertTriangle}
            label="Needs information"
            value={counts.needsInformation}
          />
          <Metric icon={CheckCircle2} label="Approved" value={counts.approved} />
          <Metric icon={XCircle} label="Declined" value={counts.declined} />
        </section>

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

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search business, contact, email, reference, or listing ID"
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["active", "Active"],
                  ["new", "New"],
                  ["reviewing", "Reviewing"],
                  ["needs_information", "Needs info"],
                  ["approved", "Approved"],
                  ["declined", "Declined"],
                  ["all", "All"],
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
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {loading && !applications.length ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleApplications.length ? (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching applications</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-900/65">
                The selected review queue is clear.
              </p>
            </div>
          ) : (
            visibleApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                note={notes[application.id] ?? ""}
                canManage={canManage}
                working={workingId === application.id}
                onNoteChange={(value) =>
                  setNotes((current) => ({
                    ...current,
                    [application.id]: value,
                  }))
                }
                onUpdate={(status) =>
                  void updateApplication(application, status)
                }
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function ApplicationCard({
  application,
  note,
  canManage,
  working,
  onNoteChange,
  onUpdate,
}: {
  application: Application;
  note: string;
  canManage: boolean;
  working: boolean;
  onNoteChange: (value: string) => void;
  onUpdate: (status: PartnerApplicationStatus) => void;
}) {
  const actions = STATUS_ACTIONS.filter(
    (status) =>
      status === application.status ||
      canTransitionPartnerApplication(application.status, status),
  );
  const merchantParams = new URLSearchParams({ email: application.email });
  if (application.existingListingId) {
    merchantParams.set("listingId", application.existingListingId);
  }

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} />
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-teal-700">
              {humanizePartnerValue(application.island)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
              {humanizePartnerValue(application.category)}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">
            {application.businessName}
          </h2>
          <p className="mt-1 font-mono text-[10px] font-bold text-slate-400">
            {application.reference}
          </p>
        </div>
        {application.status === "approved" ? (
          <Link
            href={`/admin/merchants?${merchantParams.toString()}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
          >
            <UserRoundCheck className="h-4 w-4" /> Grant merchant access
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-3 rounded-[24px] bg-slate-50 p-5 text-sm font-semibold text-slate-600">
          <ContactRow icon={Building2} value={application.contactName || "No contact name"} />
          <ContactRow icon={Mail} value={application.email} href={`mailto:${application.email}`} />
          {application.phone ? (
            <ContactRow icon={Phone} value={application.phone} href={`tel:${application.phone}`} />
          ) : null}
          {application.website ? (
            <ContactRow icon={ExternalLink} value="Open website" href={application.website} external />
          ) : null}
          <ContactRow
            icon={MapPin}
            value={
              application.existingListingId
                ? `Listing: ${application.existingListingId}`
                : "No listing ID supplied"
            }
          />
          <p className="pt-2 text-xs text-slate-400">
            Submitted {formatDate(application.submittedAt)}
          </p>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
            Services offered
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-600">
            {application.services}
          </p>
          {application.goals ? (
            <>
              <p className="mt-5 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                Partnership goals
              </p>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-7 text-slate-600">
                {application.goals}
              </p>
            </>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {application.interests.map((interest) => (
              <span key={interest} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.11em] text-teal-700">
                {humanizePartnerValue(interest)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <label className="block text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
          Internal review note
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            disabled={!canManage || working}
            maxLength={1600}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Verification findings, missing information, or onboarding next steps"
          />
        </label>
        {application.reviewedAt ? (
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Last reviewed {formatDate(application.reviewedAt)}
            {application.reviewedByEmail
              ? ` by ${application.reviewedByEmail}`
              : ""}
          </p>
        ) : null}

        {canManage ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((status) => (
              <button
                key={status}
                type="button"
                disabled={working}
                onClick={() => onUpdate(status)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50 ${actionClass(status)}`}
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : actionIcon(status)}
                {status === application.status
                  ? "Save note"
                  : humanizePartnerValue(status)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
  href,
  external = false,
}: {
  icon: typeof Building2;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-teal-700" />
      <span className="min-w-0 break-words">{value}</span>
    </>
  );
  return href ? (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-start gap-3 hover:text-teal-700"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-3">{content}</div>
  );
}

function StatusBadge({ status }: { status: PartnerApplicationStatus }) {
  const styles: Record<PartnerApplicationStatus, string> = {
    new: "bg-sky-100 text-sky-800",
    reviewing: "bg-amber-100 text-amber-800",
    needs_information: "bg-orange-100 text-orange-800",
    approved: "bg-emerald-100 text-emerald-800",
    declined: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[status]}`}>
      {humanizePartnerValue(status)}
    </span>
  );
}

function actionClass(status: PartnerApplicationStatus) {
  if (status === "approved") return "bg-emerald-700 text-white";
  if (status === "declined") return "bg-slate-700 text-white";
  if (status === "needs_information") return "bg-amber-100 text-amber-900";
  return "bg-[#043331] text-white";
}

function actionIcon(status: PartnerApplicationStatus) {
  if (status === "approved") return <BadgeCheck className="h-4 w-4" />;
  if (status === "declined") return <XCircle className="h-4 w-4" />;
  if (status === "needs_information") {
    return <AlertTriangle className="h-4 w-4" />;
  }
  return <Save className="h-4 w-4" />;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
