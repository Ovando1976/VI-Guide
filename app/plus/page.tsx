"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  Crown,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ViPublicHeader } from "@/components/brand/vi-public-header";

type Membership = {
  active: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
};

export default function TravelerPlusPage() {
  const { user, loading } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<"checkout" | "portal" | null>(null);
  const [message, setMessage] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<"success" | "cancelled" | null>(null);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("checkout");
    if (result === "success" || result === "cancelled") {
      setCheckoutResult(result);
      window.history.replaceState({}, "", "/plus");
    }
  }, []);

  useEffect(() => {
    if (loading || !user) {
      if (!loading) setMembership(null);
      return;
    }

    let cancelled = false;
    setStatusLoading(true);
    fetch("/api/membership/status", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Unable to load membership.");
        return payload.membership as Membership;
      })
      .then((next) => {
        if (!cancelled) setMembership(next);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Unable to load membership.");
        }
      })
      .finally(() => {
        if (!cancelled) setStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, checkoutResult]);

  async function startCheckout() {
    setMessage("");
    setActionLoading("checkout");
    try {
      const response = await fetch("/api/membership/checkout", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.code === "ALREADY_SUBSCRIBED") {
          setMembership({
            active: payload.subscriptionStatus === "active" || payload.subscriptionStatus === "trialing",
            status: payload.subscriptionStatus || "active",
            cancelAtPeriodEnd: false,
          });
          return;
        }
        throw new Error(payload.error || "Unable to start checkout.");
      }
      if (!payload.checkoutUrl) throw new Error("Stripe checkout is unavailable.");
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setActionLoading(null);
    }
  }

  async function openPortal() {
    setMessage("");
    setActionLoading("portal");
    try {
      const response = await fetch("/api/membership/portal", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Unable to open billing.");
      if (!payload.portalUrl) throw new Error("Billing management is unavailable.");
      window.location.assign(payload.portalUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open billing.");
    } finally {
      setActionLoading(null);
    }
  }

  const active = Boolean(membership?.active);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-28 text-[#043331]">
      <section className="bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,.24),transparent_36%),linear-gradient(145deg,#032f2d,#075e58_62%,#0f8d83)] px-4 pb-16 pt-5 text-white sm:px-6">
        <ViPublicHeader
          actionHref="/concierge?open=true"
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryHref="/"
          secondaryLabel="Explore VI Guide"
        />

        <div className="mx-auto grid max-w-6xl gap-10 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/35 bg-[#f5c451]/12 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-[#f8d879]">
              <Crown size={14} /> VI Guide Traveler Plus
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-[-.06em] sm:text-6xl lg:text-7xl">
              Put VI Guide on your trip team.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/72 sm:text-lg">
              Traveler Plus is the annual premium tier for people who want VI Guide to do more than recommend places: preserve trip context, watch important plans, and help turn island decisions into an organized journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[.12em] text-white/80">
              <BenefitPill label="Premium Concierge" />
              <BenefitPill label="Trip intelligence" />
              <BenefitPill label="Member tools" />
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white p-7 text-[#043331] shadow-2xl shadow-black/20 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#b16a18]">Annual membership</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-6xl font-black tracking-[-.07em]">$99</span>
              <span className="pb-2 text-sm font-black text-slate-500">/ year</span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              One membership for your VI Guide traveler account. Billing is handled securely by Stripe and can be managed from the Stripe customer portal.
            </p>

            {checkoutResult === "success" ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                Payment completed. We are confirming your Traveler Plus membership with Stripe.
              </div>
            ) : null}
            {checkoutResult === "cancelled" ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                Checkout was cancelled. Nothing was changed.
              </div>
            ) : null}
            {message ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
                {message}
              </div>
            ) : null}

            <div className="mt-6">
              {loading || statusLoading ? (
                <button disabled className="min-h-13 w-full rounded-2xl bg-slate-200 px-5 text-sm font-black text-slate-500">
                  Checking membership…
                </button>
              ) : !user ? (
                <Link
                  href="/login?next=%2Fplus"
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-sm font-black text-white"
                >
                  Sign in to join <ArrowRight size={17} />
                </Link>
              ) : active ? (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={actionLoading !== null}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-sm font-black text-white disabled:opacity-60"
                >
                  <Check size={17} />
                  {actionLoading === "portal" ? "Opening billing…" : "Traveler Plus active · Manage billing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={actionLoading !== null}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-5 text-sm font-black text-[#043331] shadow-lg disabled:opacity-60"
                >
                  <Crown size={17} />
                  {actionLoading === "checkout" ? "Opening secure checkout…" : "Join Traveler Plus — $99/year"}
                </button>
              )}
            </div>

            {membership && membership.status !== "none" && !active ? (
              <p className="mt-4 text-center text-xs font-bold text-slate-500">
                Billing status: {membership.status.replaceAll("_", " ")}.
              </p>
            ) : null}
            {active && membership?.cancelAtPeriodEnd ? (
              <p className="mt-4 text-center text-xs font-bold text-amber-700">
                Your membership remains active through the current paid period and is set not to renew.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            icon={Sparkles}
            title="Premium Concierge"
            body="Use your saved traveler context as the starting point for richer island-day, cruise-day, stay, dining, and transport planning."
          />
          <Feature
            icon={BellRing}
            title="Trip intelligence"
            body="Connect saved journeys with VI Guide's proactive timing and trip-risk intelligence so important plans can be rechecked as the trip changes."
          />
          <Feature
            icon={MapPinned}
            title="One island workspace"
            body="Keep recommendations, routes, bookings, traveler preferences, and island context connected instead of rebuilding the trip in separate apps."
          />
        </div>

        <div className="mt-8 rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-[.18em]">Secure billing</span>
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Stripe handles the subscription checkout.</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-emerald-950/65">
                VI Guide does not collect or store your raw card details. Membership status is verified against Stripe before the app presents the account as active.
              </p>
            </div>
            <Link href="/profile" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-emerald-300 bg-white px-5 text-[10px] font-black uppercase tracking-[.14em] text-emerald-900">
              Traveler profile <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BenefitPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
      {label}
    </span>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]">
        <Icon size={21} />
      </span>
      <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">{body}</p>
    </div>
  );
}
