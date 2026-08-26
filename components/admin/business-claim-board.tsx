"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, RefreshCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  canTransitionBusinessClaim,
  humanizeBusinessClaimValue,
  type BusinessClaimStatus,
} from "@/lib/partners/business-claim";

type Claim = {
  id: string;
  reference: string;
  businessName: string;
  existingListingId: string | null;
  contactName: string;
  email: string;
  phone: string | null;
  island: string;
  claimRole: string;
  website: string | null;
  verificationNote: string | null;
  status: BusinessClaimStatus;
  adminNote: string | null;
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

type Filter = BusinessClaimStatus | "active" | "all";

const EMPTY_COUNTS: Counts = {
  total: 0,
  new: 0,
  reviewing: 0,
  needsInformation: 0,
  approved: 0,
  declined: 0,
};

const FILTERS: Array<[Filter, string]> = [
  ["active", "Active"],
  ["new", "New"],
  ["reviewing", "Reviewing"],
  ["needs_information", "Needs info"],
  ["approved", "Approved"],
  ["declined", "Declined"],
  ["all", "All"],
];

const ACTIONS: BusinessClaimStatus[] = [
  "reviewing",
  "needs_information",
  "approved",
  "declined",
];

export function BusinessClaimBoard() {
  const [claims, setClaims] = useState<Claim[]>([]);
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
      const response = await fetch("/api/admin/business-claims", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { claims?: Claim[]; counts?: Counts; canManage?: boolean; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to load business claims.");
      const nextClaims = Array.isArray(payload?.claims) ? payload?.claims ?? [] : [];
      setClaims(nextClaims);
      setCounts(payload?.counts ?? EMPTY_COUNTS);
      setCanManage(payload?.canManage === true);
      setNotes(Object.fromEntries(nextClaims.map((claim) => [claim.id, claim.adminNote ?? ""])));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load business claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleClaims = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return claims.filter((claim) => {
      const statusMatch =
        filter === "all" ||
        (filter === "active"
          ? ["new", "reviewing", "needs_information"].includes(claim.status)
          : claim.status === filter);
      if (!statusMatch) return false;
      if (!needle) return true;
      return [
        claim.businessName,
        claim.contactName,
        claim.email,
        claim.reference,
        claim.existingListingId ?? "",
        claim.island,
        claim.claimRole,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [claims, filter, query]);

  async function updateClaim(claim: Claim, status: BusinessClaimStatus) {
    if (!canManage) return;
    setWorkingId(claim.id);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/business-claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: claim.id, status, adminNote: notes[claim.id] ?? "" }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { claim?: Claim; error?: string }
        | null;
      if (!response.ok || !payload?.claim) {
        throw new Error(payload?.error || "Unable to update the business claim.");
      }
      setMessage(`${payload.claim.businessName} is now ${humanizeBusinessClaimValue(payload.claim.status).toLowerCase()}.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the business claim.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]">Admin</Link>
          <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
          </button>
        </div>

        <section className="mt-5 rounded-[34px] bg-[#043331] p-7 text-white shadow-xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">Merchant acquisition</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">Business claim review</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/65">Verify who controls each listing before any merchant account receives access. Approval remains separate from partnership status.</p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="New" value={counts.new} />
          <Metric label="Reviewing" value={counts.reviewing} />
          <Metric label="Needs info" value={counts.needsInformation} />
          <Metric label="Approved" value={counts.approved} />
          <Metric label="Declined" value={counts.declined} />
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search business, claimant, email, reference, or listing ID" className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-600" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${filter === value ? "bg-[#043331] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{label}</button>)}
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {loading && !claims.length ? (
            <div className="grid min-h-56 place-items-center rounded-[28px] border border-slate-200 bg-white"><Loader2 className="h-7 w-7 animate-spin text-teal-700" /></div>
          ) : !visibleClaims.length ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" /><h2 className="mt-4 text-xl font-black">No matching business claims</h2></div>
          ) : visibleClaims.map((claim) => (
            <article key={claim.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">{humanizeBusinessClaimValue(claim.status)} · {humanizeBusinessClaimValue(claim.island)} · {humanizeBusinessClaimValue(claim.claimRole)}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{claim.businessName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{claim.contactName} · {claim.email}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold text-slate-400">{claim.reference}{claim.existingListingId ? ` · ${claim.existingListingId}` : ""}</p>
                </div>
                {claim.status === "approved" && claim.existingListingId ? (
                  <Link href={`/admin/merchants?${new URLSearchParams({ email: claim.email, listingId: claim.existingListingId }).toString()}`} className="inline-flex min-h-11 items-center rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em]">Grant merchant access</Link>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  <p>{claim.verificationNote || "No additional verification note provided."}</p>
                  {claim.website ? <a href={claim.website} target="_blank" rel="noreferrer" className="mt-3 inline-block font-black text-teal-700 underline">Official website</a> : null}
                </div>
                <div>
                  <textarea value={notes[claim.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [claim.id]: event.target.value }))} disabled={!canManage} maxLength={1600} rows={5} placeholder="Internal verification note" className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold outline-none focus:border-teal-600 disabled:bg-slate-50" />
                  {canManage ? <div className="mt-3 flex flex-wrap gap-2">{ACTIONS.filter((status) => status === claim.status || canTransitionBusinessClaim(claim.status, status)).map((status) => <button key={status} type="button" disabled={workingId === claim.id} onClick={() => void updateClaim(claim, status)} className="min-h-10 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.12em] text-white disabled:opacity-50">{humanizeBusinessClaimValue(status)}</button>)}</div> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-bold ${tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</div>;
}
