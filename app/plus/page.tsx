"use client";

import Image from "next/image";
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

const PLUS_SIGNALS = [
  {
    icon: Sparkles,
    title: "Premium Concierge",
    text: "Start from saved traveler and trip context instead of repeating the same preferences every time.",
  },
  {
    icon: BellRing,
    title: "Trip intelligence",
    text: "Keep important timing, readiness, and trip-risk checks connected to the journey as plans change.",
  },
  {
    icon: MapPinned,
    title: "One island workspace",
    text: "Keep routes, bookings, places, traveler preferences, and Concierge context working as one trip system.",
  },
] as const;

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
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10 lg:pb-18">
        <Image
          src="/images/places/st-john/trunk-bay-overlook-1.jpg"
          alt="Trunk Bay and the North Shore of St. John"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.99)_0%,rgba(3,47,45,.95)_45%,rgba(3,47,45,.58)_78%,rgba(3,47,45,.25)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(245,196,81,.2),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.03),rgba(2,31,29,.55))]" />

        <ViPublicHeader
          actionHref="/concierge?open=true"
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryHref="/"
          secondaryLabel="Explore VI Guide"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-3 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f8d77c] backdrop-blur-xl">
              <Crown size={14} /> VI Guide Traveler Plus
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Put VI Guide
              <span className="block italic text-[#73e3d9]">on your trip team.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/74 sm:text-xl sm:leading-8">
              Traveler Plus is the annual premium tier for people who want VI Guide to do more than recommend places—preserve trip context, watch important plans, and help turn island decisions into an organized journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[.15em] text-white/78">
              <BenefitPill label="Premium Concierge" />
              <BenefitPill label="Trip intelligence" />
              <BenefitPill label="Member tools" />
            </div>
          </div>

          <div className="rounded-[34px] border border-white/25 bg-[#fffdf8] p-6 text-[#032f2d] shadow-[0_30px_90px_rgba(2,31,29,.3)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="vi-eyebrow text-[#a86a19]">Annual membership</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="vi-display text-6xl font-bold tracking-[-.07em]">$99</span>
                  <span className="pb-2 text-sm font-black text-[#6c7c79]">/ year</span>
                </div>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#032f2d] text-[#f5c451]">
                <Crown size={22} />
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#607370]">
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
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#032f2d] px-5 text-sm font-black text-white transition hover:bg-[#075e58]"
                >
                  Sign in to join <ArrowRight size={17} className="text-[#f5c451]" />
                </Link>
              ) : active ? (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={actionLoading !== null}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#032f2d] px-5 text-sm font-black text-white transition hover:bg-[#075e58] disabled:opacity-60"
                >
                  <Check size={17} className="text-[#73e3d9]" />
                  {actionLoading === "portal" ? "Opening billing…" : "Traveler Plus active · Manage billing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={actionLoading !== null}
                  className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-5 text-sm font-black text-[#032f2d] shadow-[0_16px_36px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76] disabled:opacity-60"
                >
                  <Crown size={17} />
                  {actionLoading === "checkout" ? "Opening secure checkout…" : "Join Traveler Plus — $99/year"}
                </button>
              )}
            </div>

            {membership && membership.status !== "none" && !active ? (
              <p className="mt-4 text-center text-xs font-bold text-[#6c7c79]">
                Billing status: {membership.status.replaceAll("_", " ")}.
              </p>
            ) : null}
            {active && membership?.cancelAtPeriodEnd ? (
              <p className="mt-4 text-center text-xs font-bold text-amber-700">
                Your membership remains active through the current paid period and is set not to renew.
              </p>
            ) : null}

            <div className="mt-6 border-t border-[#e4ece9] pt-5">
              <div className="flex items-start gap-3 text-xs font-semibold leading-5 text-[#607370]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0f766e]" />
                Stripe handles subscription checkout. VI Guide verifies membership status before presenting the account as active and does not store raw card details.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="vi-eyebrow text-[#0f766e]">What Plus adds</div>
          <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
            More continuity, not more clutter.
          </h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-[#607370] sm:text-base">
            Traveler Plus is designed around the parts of a trip that benefit from remembered context and ongoing coordination—not a wall of arbitrary premium badges.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLUS_SIGNALS.map(({ icon: Icon, title, text }) => (
            <Feature key={title} icon={Icon} title={title} body={text} />
          ))}
        </div>

        <section className="mt-10 grid gap-6 rounded-[36px] bg-[#032f2d] p-6 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-9 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:p-11">
          <div>
            <div className="vi-eyebrow text-[#f5c451]">Built into the trip</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
              The premium value should show up when the plan gets complicated.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/60">
              Use the same saved places, itinerary, bookings, island context, and traveler profile you already built. Plus should make VI Guide more useful around those decisions—not force you into a separate premium product.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueSignal title="Context preserved" text="Carry traveler and trip context into richer Concierge planning." />
            <ValueSignal title="Plans watched" text="Use trip intelligence to re-check important timing and readiness." />
            <ValueSignal title="Account controlled" text="Manage billing through Stripe’s customer portal when membership is active." />
            <ValueSignal title="Core trip connected" text="Keep Plus attached to the same map, bookings, saved places, and itinerary." />
          </div>
        </section>

        <div className="mt-8 rounded-[30px] border border-[#cfe5df] bg-[#eaf8f5] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[#0f766e]">
                <ShieldCheck size={20} />
                <span className="text-[10px] font-black uppercase tracking-[.18em]">Secure billing</span>
              </div>
              <h2 className="vi-display mt-3 text-3xl font-bold tracking-[-.04em]">Stripe handles the subscription checkout.</h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-[#4f6e69]">
                VI Guide does not collect or store your raw card details. Membership status is verified against Stripe before the app presents the account as active.
              </p>
            </div>
            <Link href="/profile" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#b8ddd6] bg-white px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#0f5e58]">
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
    <div className="rounded-[28px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_14px_40px_rgba(3,47,45,.07)]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#032f2d] text-[#f5c451]">
        <Icon size={21} />
      </span>
      <h3 className="vi-display mt-5 text-2xl font-bold tracking-[-.04em]">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-[#607370]">{body}</p>
    </div>
  );
}

function ValueSignal({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <Check className="h-5 w-5 text-[#73e3d9]" />
      <h3 className="mt-4 text-sm font-black">{title}</h3>
      <p className="mt-2 text-xs font-semibold leading-5 text-white/56">{text}</p>
    </div>
  );
}
