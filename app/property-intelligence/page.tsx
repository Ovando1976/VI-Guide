"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Database, Download, MapPinned, ShieldCheck } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

type Entitlement = {
  active: boolean;
  status: string;
  purchasedAt: string | null;
};

export default function PropertyIntelligencePage() {
  const { user, loading } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("checkout");
    if (result === "success" || result === "cancelled") setCheckoutResult(result);
  }, []);

  useEffect(() => {
    if (loading || !user) {
      if (!loading) setEntitlement(null);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    setChecking(true);
    setMessage("");
    fetch(`/api/property-intelligence/entitlement${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Unable to verify access.");
        return payload.entitlement as Entitlement;
      })
      .then((next) => {
        setEntitlement(next);
        if (sessionId) window.history.replaceState({}, "", "/property-intelligence?checkout=success");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to verify access."))
      .finally(() => setChecking(false));
  }, [loading, user]);

  async function startCheckout() {
    setCheckoutLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/property-intelligence/checkout", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.code === "ALREADY_ENTITLED") {
          setEntitlement({ active: true, status: "paid", purchasedAt: null });
          return;
        }
        throw new Error(payload.error || "Unable to start checkout.");
      }
      if (!payload.checkoutUrl) throw new Error("Secure checkout is unavailable.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  const active = Boolean(entitlement?.active);

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#032f2d,#075e58_58%,#0f8d83)] p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-[#f7d778]">
                <Database size={15} /> Property Intelligence Export Pack
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-.06em] sm:text-6xl">
                Turn USVI geography into usable property data.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/72">
                A governed export of USVI Explorer estate intelligence with canonical identifiers, aliases, centroids, source provenance, and fail-closed overlay status. Parcel, zoning, and historic overlays are never presented as joined until the source match is verified.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/15 bg-white p-6 text-[#043331] shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#a86a19]">One-time digital product</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Property Intelligence Export</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                The launch price is controlled in Stripe and shown in secure checkout. Purchase once and keep export access on this traveler account.
              </p>

              {checkoutResult === "success" && !active ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                  Payment returned successfully. We are verifying it directly with Stripe.
                </div>
              ) : null}
              {checkoutResult === "cancelled" ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                  Checkout was cancelled. No access was changed.
                </div>
              ) : null}
              {message ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">{message}</div>
              ) : null}

              <div className="mt-5">
                {loading || checking ? (
                  <button disabled className="min-h-12 w-full rounded-2xl bg-slate-200 px-4 text-sm font-black text-slate-500">
                    Checking access…
                  </button>
                ) : !user ? (
                  <Link href="/login?next=%2Fproperty-intelligence" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-4 text-sm font-black text-white">
                    Sign in to purchase <ArrowRight size={17} />
                  </Link>
                ) : active ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <a href="/api/property-intelligence/export?format=csv" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-4 text-sm font-black text-[#043331]">
                      <Download size={17} /> CSV export
                    </a>
                    <a href="/api/property-intelligence/export?format=json" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-4 text-sm font-black text-white">
                      <Download size={17} /> JSON export
                    </a>
                  </div>
                ) : (
                  <button type="button" onClick={startCheckout} disabled={checkoutLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-4 text-sm font-black text-[#043331] disabled:opacity-60">
                    <ShieldCheck size={17} /> {checkoutLoading ? "Opening secure checkout…" : "Buy export access"}
                  </button>
                )}
              </div>

              {active ? (
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <Check size={17} /> Paid export access active
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Feature title="Canonical estate records" body="Estate GEOIDs, names, aliases, island codes, centroids, and geometry type in one export." />
          <Feature title="Provenance attached" body="Each record carries source references and the dataset it was generated from so buyers can audit lineage." />
          <Feature title="Fail-closed overlays" body="Parcel, zoning, and historic-district fields remain explicitly not joined until a governed match is available." />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-teal-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MapPinned className="mt-1 text-teal-700" />
            <div>
              <h2 className="text-xl font-black">Preview the territory intelligence first.</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Explore the live intelligence workspace before purchasing export access.</p>
            </div>
          </div>
          <Link href="/intelligence" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white">
            Open Intelligence <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black tracking-[-.035em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{body}</p>
    </article>
  );
}
