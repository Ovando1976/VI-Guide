"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  ExternalLink,
  Landmark,
  Loader2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

type PayoutStatus = {
  state: "not_started" | "onboarding" | "ready";
  transferStatus: "active" | "pending" | "restricted" | "inactive" | "unknown";
  accountId: string | null;
  dashboard: string | null;
  livemode?: boolean | null;
  listingIds: string[];
};

export function MerchantPayoutSetup({ listingCount }: { listingCount: number }) {
  const [payout, setPayout] = useState<PayoutStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"onboarding" | "dashboard" | null>(null);
  const [error, setError] = useState("");
  const [returnMessage, setReturnMessage] = useState("");

  const statusCopy = useMemo(() => {
    if (!payout || payout.state === "not_started") {
      return {
        eyebrow: "Setup required",
        title: "Connect a payout account",
        detail:
          "Stripe verifies your business and payout details before VI Guide can release merchant settlement.",
      };
    }
    if (payout.state === "ready") {
      return {
        eyebrow: "Transfers active",
        title: "Your payout account is ready",
        detail:
          "Completed, verified bookings can be released to this Stripe account after VI Guide settlement checks pass.",
      };
    }
    return {
      eyebrow: "Verification in progress",
      title: "Finish Stripe payout setup",
      detail:
        "Stripe still needs information or verification before this account can receive marketplace transfers.",
    };
  }, [payout]);

  async function loadStatus() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/merchant/connect/status", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { payout?: PayoutStatus; error?: string }
        | null;
      if (!response.ok || !payload?.payout) {
        throw new Error(payload?.error || "Unable to load payout status.");
      }
      setPayout(payload.payout);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load payout status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("connect");
    if (result === "returned") {
      setReturnMessage(
        "Stripe returned you to VI Guide. We are checking whether transfers are active.",
      );
      window.history.replaceState({}, "", "/merchant/payouts");
    } else if (result === "ready") {
      setReturnMessage("Stripe payout setup is active.");
      window.history.replaceState({}, "", "/merchant/payouts");
    } else if (result === "refresh") {
      setReturnMessage("Your Stripe onboarding link expired. Start setup again below.");
      window.history.replaceState({}, "", "/merchant/payouts");
    }
    void loadStatus();
  }, []);

  async function startOnboarding() {
    setAction("onboarding");
    setError("");
    try {
      const response = await fetch("/api/merchant/connect/onboarding", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            onboardingUrl?: string;
            redirectUrl?: string;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to start Stripe payout setup.");
      }
      const destination = payload?.onboardingUrl || payload?.redirectUrl;
      if (!destination) throw new Error("Stripe did not return a payout setup destination.");
      window.location.assign(destination);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to start Stripe payout setup.",
      );
      setAction(null);
    }
  }

  async function openDashboard() {
    setAction("dashboard");
    setError("");
    try {
      const response = await fetch("/api/merchant/connect/dashboard", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { dashboardUrl?: string; error?: string }
        | null;
      if (!response.ok || !payload?.dashboardUrl) {
        throw new Error(payload?.error || "Unable to open Stripe payouts.");
      }
      window.location.assign(payload.dashboardUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to open Stripe payouts.");
      setAction(null);
    }
  }

  return (
    <main className="px-4 py-8 pb-32 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/merchant"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-teal-800"
        >
          <ArrowLeft className="h-4 w-4" /> Merchant operations
        </Link>

        <section className="mt-5 overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.3),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Marketplace payouts
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Get paid through VI Guide.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Travelers pay VI Guide securely. After a booking is delivered and
                passes settlement checks, the merchant share is released to your
                verified Stripe payout account.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-6">
              <CircleDollarSign className="h-6 w-6 text-[#f5c451]" />
              <p className="mt-5 text-[9px] font-black uppercase tracking-[.16em] text-white/45">
                Marketplace economics
              </p>
              <p className="mt-2 text-3xl font-black">90% merchant share</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
                VI Guide retains a 10% platform commission on marketplace booking
                payments under the current commerce policy.
              </p>
            </div>
          </div>
        </section>

        {returnMessage ? (
          <div className="mt-6 rounded-[24px] border border-teal-200 bg-teal-50 p-5 text-sm font-bold text-teal-900">
            {returnMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm font-bold leading-6 text-rose-900">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {loading ? (
              <div className="flex min-h-56 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                      {statusCopy.eyebrow}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                      {statusCopy.title}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                      {statusCopy.detail}
                    </p>
                  </div>
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                      payout?.state === "ready"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {payout?.state === "ready" ? (
                      <BadgeCheck className="h-6 w-6" />
                    ) : (
                      <WalletCards className="h-6 w-6" />
                    )}
                  </span>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <Metric label="Assigned listings" value={String(listingCount)} />
                  <Metric
                    label="Transfer capability"
                    value={payout?.transferStatus.replaceAll("_", " ") || "unknown"}
                  />
                  <Metric
                    label="Stripe mode"
                    value={payout?.livemode === false ? "Test" : "Live"}
                  />
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  {payout?.state !== "ready" ? (
                    <button
                      type="button"
                      onClick={startOnboarding}
                      disabled={action !== null}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
                    >
                      {action === "onboarding" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {payout?.state === "not_started"
                        ? "Set up Stripe payouts"
                        : "Continue Stripe verification"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openDashboard}
                      disabled={action !== null}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
                    >
                      {action === "dashboard" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Open Stripe payouts
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void loadStatus()}
                    disabled={loading || action !== null}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 px-6 text-[10px] font-black uppercase tracking-[.14em] disabled:opacity-60"
                  >
                    Refresh status
                  </button>
                </div>
              </>
            )}
          </article>

          <article className="rounded-[32px] bg-[#f8f4ea] p-6 sm:p-8">
            <Landmark className="h-6 w-6 text-teal-700" />
            <p className="mt-6 text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              Settlement protection
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
              Money moves only after delivery.
            </h2>
            <div className="mt-6 space-y-4">
              {[
                ["1", "Traveler payment is verified by Stripe."],
                ["2", "Provider confirms and completes the booked service."],
                ["3", "VI Guide checks refunds, disputes, and financial holds."],
                ["4", "The merchant net is released to the connected Stripe account."],
              ].map(([number, copy]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#043331] text-[10px] font-black text-[#f5c451]">
                    {number}
                  </span>
                  <p className="pt-1 text-sm font-semibold leading-5 text-slate-600">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            icon={Building2}
            title="One verified merchant"
            detail="Your connected payout profile follows your assigned VI Guide listings."
          />
          <InfoCard
            icon={ShieldCheck}
            title="Stripe-hosted verification"
            detail="Business, identity, and bank information is collected and verified by Stripe."
          />
          <InfoCard
            icon={WalletCards}
            title="No card data in VI Guide"
            detail="Traveler checkout and merchant payout credentials stay inside Stripe's secure flows."
          />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4">
      <p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-black capitalize text-[#043331]">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof ShieldCheck;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-black tracking-[-.03em]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{detail}</p>
    </article>
  );
}
