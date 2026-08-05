"use client";

import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Inbox,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BookingActivityFeed } from "@/components/booking/booking-activity-feed";
import {
  merchantCommerceTransitionsForStatus,
  type MerchantCommerceTransition,
} from "@/lib/payments/commerce-booking-lifecycle";
import type { CommerceBookingStatus } from "@/types/commerce-booking";

type MerchantBooking = {
  id: string;
  reference: string;
  status: CommerceBookingStatus;
  kind: string;
  listingId: string;
  listingName: string;
  island: string;
  startDate: string;
  endDate: string | null;
  preferredTime: string | null;
  adults: number;
  children: number;
  guestName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  merchantNote: string | null;
  proposedTime: string | null;
  depositAmountCents: number | null;
  paidAmountCents: number | null;
  paymentStatus: string;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Filter = "action" | "awaiting" | "confirmed" | "closed" | "all";

type UpdateOptions = {
  merchantNote?: string;
  proposedTime?: string;
  depositAmountCents?: number;
};

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "action", label: "Needs action" },
  { id: "awaiting", label: "Awaiting payment" },
  { id: "confirmed", label: "Confirmed" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

export function MerchantReservationInbox() {
  const [bookings, setBookings] = useState<MerchantBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("action");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: MerchantBooking[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load reservations.");
      }
      setBookings(payload?.bookings ?? []);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load reservations.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
    const timer = window.setInterval(() => void loadBookings(true), 15_000);
    return () => window.clearInterval(timer);
  }, [loadBookings]);

  const visible = useMemo(
    () => bookings.filter((booking) => matchesFilter(booking.status, filter)),
    [bookings, filter],
  );

  async function updateBooking(
    booking: MerchantBooking,
    status: MerchantCommerceTransition,
    options: UpdateOptions = {},
  ) {
    setSavingId(booking.id);
    setError(null);
    try {
      const response = await fetch(`/api/merchant-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...options }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { booking?: Partial<MerchantBooking>; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update booking.");
      }
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...payload?.booking } : item,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to update booking.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map(({ id }) => [
          id,
          bookings.filter((booking) => matchesFilter(booking.status, id)).length,
        ]),
      ) as Record<Filter, number>,
    [bookings],
  );

  const activity = useMemo(
    () =>
      [...bookings]
        .sort(
          (left, right) =>
            Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
        )
        .slice(0, 6),
    [bookings],
  );

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Business operations
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Reservation Inbox
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/65">
                Move each request through review, secure payment, confirmation,
                and completion. A reservation cannot be confirmed until Stripe
                has verified the customer payment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadBookings()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.15em]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-[24px] border p-5 text-left shadow-sm transition ${
                filter === item.id
                  ? "border-[#043331] bg-[#043331] text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-2xl font-black">{counts[item.id]}</p>
              <p
                className={`mt-1 text-[9px] font-black uppercase tracking-[.15em] ${
                  filter === item.id ? "text-white/55" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <section className="space-y-4">
            {loading ? (
              <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
                <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
              </div>
            ) : visible.length ? (
              visible.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  saving={savingId === booking.id}
                  onUpdate={updateBooking}
                />
              ))
            ) : (
              <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Inbox className="mx-auto h-10 w-10 text-teal-700" />
                <h2 className="mt-4 text-2xl font-black">
                  No reservations in this view
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  New traveler requests and payment updates will appear here
                  automatically.
                </p>
              </div>
            )}
          </section>

          <BookingActivityFeed activities={activity} />
        </div>
      </div>
    </main>
  );
}

function BookingCard({
  booking,
  saving,
  onUpdate,
}: {
  booking: MerchantBooking;
  saving: boolean;
  onUpdate: (
    booking: MerchantBooking,
    status: MerchantCommerceTransition,
    options?: UpdateOptions,
  ) => Promise<void>;
}) {
  const [note, setNote] = useState(booking.merchantNote ?? "");
  const [proposedTime, setProposedTime] = useState(
    booking.proposedTime ?? booking.preferredTime ?? "",
  );
  const [depositDollars, setDepositDollars] = useState(
    booking.depositAmountCents
      ? (booking.depositAmountCents / 100).toFixed(2)
      : "",
  );

  useEffect(() => {
    setNote(booking.merchantNote ?? "");
    setProposedTime(booking.proposedTime ?? booking.preferredTime ?? "");
    setDepositDollars(
      booking.depositAmountCents
        ? (booking.depositAmountCents / 100).toFixed(2)
        : "",
    );
  }, [
    booking.depositAmountCents,
    booking.merchantNote,
    booking.preferredTime,
    booking.proposedTime,
    booking.status,
  ]);

  const allowed = merchantCommerceTransitionsForStatus(booking.status);
  const depositAmountCents = dollarsToCents(depositDollars);
  const hasActiveCheckout = Boolean(
    booking.checkoutSessionId && booking.paymentStatus === "pending",
  );
  const updateOptions = {
    merchantNote: note,
    proposedTime,
  };

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
            {booking.reference}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
            {booking.listingName}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {booking.guestName} · {booking.adults + booking.children} guests ·{" "}
            {booking.startDate}
            {booking.endDate ? ` to ${booking.endDate}` : ""}
          </p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#f8f4ea] p-4 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <div>
          <strong className="block text-[#043331]">Contact</strong>
          {booking.email}
          {booking.phone ? ` · ${booking.phone}` : ""}
        </div>
        <div>
          <strong className="block text-[#043331]">Preferred time</strong>
          {booking.preferredTime || "Not specified"}
        </div>
        <div>
          <strong className="block text-[#043331]">Traveler notes</strong>
          {booking.notes || "None"}
        </div>
      </div>

      <LifecycleNotice booking={booking} hasActiveCheckout={hasActiveCheckout} />
      <PaymentSummary booking={booking} />

      {booking.status === "requested" || booking.status === "reviewing" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px]">
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Message for traveler
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={1200}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600"
              placeholder="Add availability details or explain an alternate time."
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Proposed time
            <input
              value={proposedTime}
              onChange={(event) => setProposedTime(event.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600"
              placeholder="2:30 PM"
            />
          </label>
        </div>
      ) : null}

      {allowed.includes("payment_required") ? (
        <label className="mt-5 block max-w-xs text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
          Deposit amount (USD)
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 focus-within:border-teal-600">
            <span className="text-sm font-black text-teal-700">$</span>
            <input
              inputMode="decimal"
              value={depositDollars}
              onChange={(event) => setDepositDollars(event.target.value)}
              className="min-w-0 flex-1 text-sm font-bold normal-case tracking-normal text-[#043331] outline-none"
              placeholder="50.00"
            />
          </div>
          <span className="mt-2 block text-[11px] font-semibold normal-case tracking-normal text-slate-500">
            The customer creates Stripe Checkout from their private booking
            status page.
          </span>
        </label>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {allowed.includes("reviewing") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onUpdate(booking, "reviewing", updateOptions)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
          >
            <Clock3 className="h-4 w-4" /> Start review
          </button>
        ) : null}

        {allowed.includes("payment_required") ? (
          <button
            type="button"
            disabled={saving || depositAmountCents <= 0}
            onClick={() =>
              void onUpdate(booking, "payment_required", {
                ...updateOptions,
                depositAmountCents,
              })
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" /> Request deposit
          </button>
        ) : null}

        {allowed.includes("confirmed") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onUpdate(booking, "confirmed", updateOptions)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm paid booking
          </button>
        ) : null}

        {allowed.includes("completed") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onUpdate(booking, "completed", updateOptions)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark complete
          </button>
        ) : null}

        {allowed.includes("declined") &&
        (booking.status === "requested" || booking.status === "reviewing") ? (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onUpdate(booking, "declined", updateOptions)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[9px] font-black uppercase tracking-[.14em] text-red-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Decline
          </button>
        ) : null}

        {allowed.includes("cancelled") &&
        booking.status === "payment_required" &&
        !hasActiveCheckout ? (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onUpdate(booking, "cancelled", updateOptions)
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[9px] font-black uppercase tracking-[.14em] text-red-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Cancel payment request
          </button>
        ) : null}

        {booking.merchantNote ? (
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
            <MessageSquareText className="h-4 w-4" /> Traveler message saved
          </span>
        ) : null}
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin self-center text-teal-700" />
        ) : null}
      </div>
    </article>
  );
}

function LifecycleNotice({
  booking,
  hasActiveCheckout,
}: {
  booking: MerchantBooking;
  hasActiveCheckout: boolean;
}) {
  const content = lifecycleCopy(booking, hasActiveCheckout);
  return (
    <div
      className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold leading-6 ${content.className}`}
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{content.message}</span>
    </div>
  );
}

function PaymentSummary({ booking }: { booking: MerchantBooking }) {
  if (
    !["payment_required", "paid", "confirmed", "completed"].includes(
      booking.status,
    )
  ) {
    return null;
  }

  return (
    <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-3">
      <SummaryItem
        label="Deposit"
        value={formatMoney(booking.depositAmountCents ?? 0)}
        icon={CircleDollarSign}
      />
      <SummaryItem
        label="Paid"
        value={formatMoney(booking.paidAmountCents ?? 0)}
        icon={CreditCard}
      />
      <SummaryItem
        label="Payment"
        value={booking.paymentStatus.replaceAll("_", " ")}
        icon={ShieldCheck}
      />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-emerald-700">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-black capitalize">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: CommerceBookingStatus }) {
  const labels: Record<CommerceBookingStatus, string> = {
    draft: "Draft",
    requested: "New request",
    reviewing: "Under review",
    payment_required: "Awaiting payment",
    paid: "Payment verified",
    confirmed: "Confirmed",
    completed: "Completed",
    declined: "Declined",
    cancelled: "Cancelled",
  };
  const className =
    status === "paid" || status === "confirmed" || status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "declined" || status === "cancelled"
        ? "bg-red-100 text-red-700"
        : status === "payment_required"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] ${className}`}
    >
      {labels[status]}
    </span>
  );
}

function matchesFilter(status: CommerceBookingStatus, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "action") {
    return ["requested", "reviewing", "paid"].includes(status);
  }
  if (filter === "awaiting") return status === "payment_required";
  if (filter === "confirmed") return status === "confirmed";
  return ["completed", "declined", "cancelled"].includes(status);
}

function lifecycleCopy(booking: MerchantBooking, hasActiveCheckout: boolean) {
  if (booking.status === "paid") {
    return {
      message:
        "Stripe verified the customer payment. Confirm only after the provider has reserved the requested inventory or service.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    };
  }
  if (booking.status === "payment_required") {
    return {
      message: hasActiveCheckout
        ? "The customer has an active Stripe Checkout Session. Do not close this request until that session is expired or payment status changes."
        : "The traveler can now open their private booking page and start secure Stripe Checkout.",
      className: "border-blue-200 bg-blue-50 text-blue-950",
    };
  }
  if (booking.status === "confirmed") {
    return {
      message:
        "This paid reservation is confirmed and is synchronized into the traveler itinerary.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    };
  }
  if (booking.status === "completed") {
    return {
      message: "The provider marked this booking fulfilled.",
      className: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }
  if (booking.status === "declined" || booking.status === "cancelled") {
    return {
      message:
        "This request is closed. A new request is required before payment or confirmation can continue.",
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }
  return {
    message:
      "Review availability, add a traveler message, then request a deposit. Confirmation remains locked until Stripe verifies payment.",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  };
}

function dollarsToCents(value: string) {
  const normalized = value.trim().replace(/[$,]/g, "");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && cents <= 10_000_000 ? cents : 0;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
