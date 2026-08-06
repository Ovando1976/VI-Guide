"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { formatMerchantOfferMoney } from "@/lib/merchant-offers";

type DepositSource = "offer" | "merchant_override" | "manual";

type OfferBooking = {
  id: string;
  reference: string;
  status: string;
  listingName: string;
  offerId: string | null;
  offerTitle: string | null;
  offerPriceCents: number | null;
  offerCompareAtCents: number | null;
  offerDepositCents: number | null;
  depositAmountCents: number | null;
  depositSource: DepositSource | null;
  offerDepositAmountCents: number | null;
  offerDepositOverridden: boolean;
  offerDepositOverrideCents: number | null;
  offerDepositOverrideAt: string | null;
  offerDepositOverrideByEmail: string | null;
  guestName: string;
  startDate: string;
  createdAt: string;
};

export function MerchantOfferBookingSummary() {
  const [bookings, setBookings] = useState<OfferBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: OfferBooking[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load package requests.");
      }
      const nextBookings = payload?.bookings;
      setBookings(Array.isArray(nextBookings) ? nextBookings : []);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load package requests.",
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

  const offerBookings = useMemo(
    () =>
      bookings
        .filter((booking) => Boolean(booking.offerId && booking.offerTitle))
        .sort(
          (left, right) =>
            Date.parse(right.createdAt) - Date.parse(left.createdAt),
        )
        .slice(0, 8),
    [bookings],
  );
  const unresolvedDepositCount = offerBookings.filter(
    (booking) =>
      booking.offerDepositCents !== null && booking.depositAmountCents === null,
  ).length;
  const overriddenDepositCount = offerBookings.filter(
    (booking) => booking.offerDepositOverridden,
  ).length;
  const depositMismatchCount = offerBookings.filter(
    (booking) =>
      booking.offerDepositCents !== null &&
      booking.depositAmountCents !== null &&
      booking.offerDepositCents !== booking.depositAmountCents,
  ).length;

  if (!loading && !error && !offerBookings.length) return null;

  return (
    <section className="bg-[#f7f2e7] px-4 pt-6 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.15em] text-amber-700">
              Offer-generated demand
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              Package requests carry verified commercial context
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-amber-950/65">
              Review the snapshotted package price, expected deposit, and durable
              deposit decision before moving the reservation into payment.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh packages
          </button>
        </div>

        {error ? (
          <div className="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : null}

        {!error ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon={BadgeDollarSign}
              label="Recent package requests"
              value={offerBookings.length}
            />
            <Metric
              icon={Clock3}
              label="Deposit not requested"
              value={unresolvedDepositCount}
              attention={unresolvedDepositCount > 0}
            />
            <Metric
              icon={ShieldCheck}
              label="Merchant overrides"
              value={overriddenDepositCount}
              attention={overriddenDepositCount > 0}
            />
            <Metric
              icon={AlertTriangle}
              label="Deposit differs"
              value={depositMismatchCount}
              attention={depositMismatchCount > 0}
            />
          </div>
        ) : null}

        {!error && offerBookings.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {offerBookings.map((booking) => {
              const mismatch = Boolean(
                booking.offerDepositCents !== null &&
                  booking.depositAmountCents !== null &&
                  booking.offerDepositCents !== booking.depositAmountCents,
              );
              return (
                <article
                  key={booking.id}
                  className="rounded-[24px] border border-amber-100 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[.13em] text-amber-700">
                        {booking.reference}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-.035em]">
                        {booking.offerTitle}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {booking.guestName} · {booking.startDate} · {booking.listingName}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
                      {booking.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Value
                      label="Package price"
                      value={formatMerchantOfferMoney(
                        booking.offerPriceCents ?? 0,
                      )}
                    />
                    <Value
                      label="Offer deposit"
                      value={
                        booking.offerDepositCents !== null
                          ? formatMerchantOfferMoney(booking.offerDepositCents)
                          : "Flexible"
                      }
                    />
                    <Value
                      label={depositSourceLabel(booking.depositSource)}
                      value={
                        booking.depositAmountCents !== null
                          ? formatMerchantOfferMoney(booking.depositAmountCents)
                          : "Not requested"
                      }
                      attention={mismatch}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    {booking.offerDepositOverridden ? (
                      <p className="flex items-start gap-2 text-xs font-bold leading-5 text-rose-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Merchant override recorded
                          {booking.offerDepositOverrideByEmail
                            ? ` by ${booking.offerDepositOverrideByEmail}`
                            : ""}
                          {booking.offerDepositOverrideAt
                            ? ` on ${formatTime(booking.offerDepositOverrideAt)}`
                            : ""}
                          .
                        </span>
                      </p>
                    ) : booking.depositAmountCents !== null ? (
                      <p className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        {booking.depositSource === "offer"
                          ? "Published offer deposit applied."
                          : "Deposit decision recorded."}
                      </p>
                    ) : (
                      <span />
                    )}
                    {booking.offerId ? (
                      <Link
                        href={`/offers/${encodeURIComponent(booking.offerId)}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-teal-700"
                      >
                        View package <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  attention = false,
}: {
  icon: typeof BadgeDollarSign;
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        attention
          ? "border-rose-200 bg-rose-50"
          : "border-amber-100 bg-white"
      }`}
    >
      <Icon className="h-5 w-5 text-amber-700" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Value({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: string;
  attention?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-black ${
          attention ? "text-rose-700" : "text-[#043331]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function depositSourceLabel(value: DepositSource | null) {
  if (value === "offer") return "Offer default";
  if (value === "merchant_override") return "Merchant override";
  if (value === "manual") return "Manual deposit";
  return "Requested deposit";
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
