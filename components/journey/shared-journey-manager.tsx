"use client";

import Link from "next/link";
import { Copy, ExternalLink, Link2, Loader2, ShieldOff } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import type { IntelligenceIsland } from "@/types/intelligence";

export const SHARED_JOURNEYS_UPDATED_EVENT = "vi-guide-shared-journeys-updated";

type ShareSummary = {
  id: string;
  href: string;
  planId: string;
  title: string;
  island: IntelligenceIsland;
  date: string;
  stopCount: number;
  createdAt: string;
};

const ISLANDS: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export function SharedJourneyManager() {
  const { user } = useAuth();
  const [shares, setShares] = useState<ShareSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setShares([]);
      return;
    }
    const authenticatedUser = user;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const token = await authenticatedUser.getIdToken();
        const response = await fetch("/api/shared-journeys", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as { shares?: ShareSummary[]; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || "Could not load shared trips.");
        const nextShares = payload?.shares;
        if (!cancelled) setShares(Array.isArray(nextShares) ? nextShares : []);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Could not load shared trips.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function refresh() { void load(); }
    void load();
    window.addEventListener(SHARED_JOURNEYS_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SHARED_JOURNEYS_UPDATED_EVENT, refresh);
    };
  }, [user]);

  async function copyLink(share: ShareSummary) {
    await navigator.clipboard.writeText(new URL(share.href, window.location.origin).toString());
    setMessage("Share link copied");
  }

  async function revoke(shareId: string) {
    if (!user || revokingId) return;
    setRevokingId(shareId);
    setMessage("Revoking link…");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/shared-journeys", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Could not revoke link.");
      setShares((current) => current.filter((share) => share.id !== shareId));
      setMessage("Shared access revoked. Your original journey is unchanged.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not revoke link.");
    } finally {
      setRevokingId(null);
    }
  }

  if (!user) return null;

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Shared trips</div><h2 className="mt-2 text-2xl font-black tracking-[-.035em]">Manage read-only links</h2></div>
        {loading ? <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400"><Loader2 className="animate-spin" size={14} /> Loading</span> : <span className="rounded-full bg-[#edf6f2] px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800">{shares.length} active</span>}
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Anyone with an active link can view its snapshot. They cannot edit your journey or access your account.</p>
      <div className="mt-5 space-y-2">
        {shares.map((share) => (
          <article key={share.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4">
            <div className="min-w-0"><h3 className="truncate text-sm font-black">{share.title}</h3><p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-slate-400">{ISLANDS[share.island]} · {share.date} · {share.stopCount} stops</p></div>
            <div className="flex flex-wrap gap-2"><Link href={share.href} target="_blank" className="grid h-9 w-9 place-items-center rounded-full bg-white text-teal-800" aria-label={`Open shared link for ${share.title}`}><ExternalLink size={14} /></Link><button type="button" onClick={() => copyLink(share)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-teal-800" aria-label={`Copy shared link for ${share.title}`}><Copy size={14} /></button><button type="button" onClick={() => revoke(share.id)} disabled={Boolean(revokingId)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-rose-50 px-3 text-[9px] font-black uppercase tracking-[.12em] text-rose-700 disabled:opacity-50"><ShieldOff size={13} /> {revokingId === share.id ? "Revoking" : "Revoke"}</button></div>
          </article>
        ))}
        {!loading && !shares.length ? <div className="rounded-[22px] border border-dashed border-slate-300 p-7 text-center"><Link2 className="mx-auto text-slate-300" size={26} /><p className="mt-3 text-sm font-bold text-slate-500">No active share links yet.</p></div> : null}
      </div>
      {message ? <p className="mt-4 text-xs font-bold text-teal-800">{message}</p> : null}
    </section>
  );
}
