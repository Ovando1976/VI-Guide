"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Search,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import type { PartnerApplicationStatus } from "@/lib/partners/partner-application";

type PublicApplication = {
  reference: string;
  businessName: string;
  status: PartnerApplicationStatus;
  label: string;
  message: string;
  action: string | null;
  submittedAt: string;
  updatedAt: string;
};

export function PartnerApplicationStatusTracker() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState<PublicApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setApplication(null);
    try {
      const response = await fetch("/api/partner-applications/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { application?: PublicApplication; error?: string }
        | null;
      if (!response.ok || !payload?.application) {
        throw new Error(payload?.error || "Unable to load the application status.");
      }
      setApplication(payload.application);
      setReference(payload.application.reference);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load the application status.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/partners/apply"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
        >
          <ArrowLeft className="h-4 w-4" /> Partner application
        </Link>

        <section className="mt-5 overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.32),transparent_35%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
            Application tracker
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
            Check your VI Guide partner review.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
            Use the application reference and the same contact email submitted with
            the business application. Internal review notes remain private.
          </p>
        </section>

        <form
          onSubmit={lookup}
          className="mt-6 grid gap-4 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
        >
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
            Application reference
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                placeholder="VI-PARTNER-20260805-ABC123"
                maxLength={40}
                autoComplete="off"
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 font-mono text-sm font-bold normal-case tracking-normal outline-none focus:border-teal-600"
              />
            </div>
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
            Contact email
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={220}
                autoComplete="email"
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold normal-case tracking-normal outline-none focus:border-teal-600"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Check status
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold leading-6 text-rose-700">
            {error}
          </div>
        ) : null}

        {application ? (
          <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${statusIconClass(application.status)}`}>
                  {statusIcon(application.status)}
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    {application.reference}
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                    {application.label}
                  </h2>
                </div>
              </div>
              <span className={`rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.13em] ${statusBadgeClass(application.status)}`}>
                {application.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-7 rounded-[24px] bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-teal-700" />
                <p className="text-lg font-black">{application.businessName}</p>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                {application.message}
              </p>
              {application.action ? (
                <p className="mt-3 text-sm font-black leading-6 text-[#043331]">
                  {application.action}
                </p>
              ) : null}
            </div>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <DateDetail label="Submitted" value={application.submittedAt} />
              <DateDetail label="Last updated" value={application.updatedAt} />
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function statusIcon(status: PartnerApplicationStatus) {
  if (status === "approved") return <BadgeCheck className="h-6 w-6" />;
  if (status === "declined") return <CheckCircle2 className="h-6 w-6" />;
  return <Clock3 className="h-6 w-6" />;
}

function statusIconClass(status: PartnerApplicationStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "declined") return "bg-slate-200 text-slate-700";
  if (status === "needs_information") return "bg-amber-100 text-amber-800";
  return "bg-teal-50 text-teal-700";
}

function statusBadgeClass(status: PartnerApplicationStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "declined") return "bg-slate-200 text-slate-700";
  if (status === "needs_information") return "bg-amber-100 text-amber-900";
  if (status === "reviewing") return "bg-sky-100 text-sky-800";
  return "bg-teal-50 text-teal-700";
}

function DateDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3">
      <dt className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-slate-600">
        {formatDate(value)}
      </dd>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
