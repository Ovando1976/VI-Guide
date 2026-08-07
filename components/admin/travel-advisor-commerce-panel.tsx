import Link from "next/link";
import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  ReceiptText,
} from "lucide-react";

import { OpsPill } from "@/components/ops/ops-ui";
import {
  advisorCommerceStatusLabel,
  type AdvisorCommerceBooking,
  type AdvisorCommerceSummary,
  type AdvisorCommerceStatus,
} from "@/lib/travel-advisor-commerce";

export function TravelAdvisorCommercePanel({
  bookings,
  summary,
  conversionStartedAt,
}: {
  bookings: AdvisorCommerceBooking[];
  summary: AdvisorCommerceSummary;
  conversionStartedAt: string | null;
}) {
  if (!bookings.length) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-[24px] border border-emerald-200 bg-[linear-gradient(145deg,#f1fbf7,#ffffff)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100 px-5 py-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">
            Booking & revenue loop
          </p>
          <h3 className="mt-1 text-xl font-black tracking-[-.035em] text-[#043331]">
            Proposal conversion activity
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {conversionStartedAt
              ? `Conversion started ${formatDateTime(conversionStartedAt)}.`
              : "A proposal stop has entered VI Guide commerce."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OpsPill label={`${summary.totalBookings} booking${summary.totalBookings === 1 ? "" : "s"}`} tone="teal" />
          {summary.paymentRequired ? (
            <OpsPill label={`${summary.paymentRequired} payment required`} tone="amber" />
          ) : null}
          {summary.confirmedBookings ? (
            <OpsPill label={`${summary.confirmedBookings} confirmed`} tone="emerald" />
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-b border-emerald-100 bg-white/70 p-4 sm:grid-cols-3">
        <RevenueMetric
          icon={ReceiptText}
          label="Requests"
          value={String(summary.totalBookings)}
        />
        <RevenueMetric
          icon={CreditCard}
          label="Paid bookings"
          value={String(summary.paidBookings)}
        />
        <RevenueMetric
          icon={BadgeDollarSign}
          label="Recorded revenue"
          value={formatMoney(summary.paidAmountCents)}
        />
      </div>

      <div className="divide-y divide-emerald-100">
        {bookings.map((booking) => (
          <article key={booking.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <OpsPill
                    label={advisorCommerceStatusLabel(booking.status)}
                    tone={commerceTone(booking.status)}
                  />
                  <span className="font-mono text-[9px] font-bold text-slate-400">
                    {booking.reference || booking.id}
                  </span>
                </div>
                <h4 className="mt-2 text-base font-black text-[#043331]">
                  {booking.listingName}
                </h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {bookingDateLabel(booking)} · {humanize(booking.kind)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                  Payment
                </p>
                <p className="mt-1 text-sm font-black text-[#043331]">
                  {booking.paidAmountCents > 0
                    ? formatMoney(booking.paidAmountCents)
                    : humanize(booking.paymentStatus)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/merchant/reservations"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white"
              >
                <CalendarCheck2 className="h-3.5 w-3.5" /> Manage reservation
              </Link>
              {booking.sourceProposalShareId ? (
                <Link
                  href={`/shared-trip/${booking.sourceProposalShareId}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
                >
                  Proposal <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
              {booking.status === "payment_required" ? (
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 text-[9px] font-black uppercase tracking-[.13em] text-amber-800">
                  <Clock3 className="h-3.5 w-3.5" /> Traveler payment pending
                </span>
              ) : null}
              {booking.status === "confirmed" || booking.status === "completed" ? (
                <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[.13em] text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Revenue converted
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RevenueMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-emerald-100 bg-white p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        <Icon className="h-4 w-4 text-emerald-700" /> {label}
      </div>
      <p className="mt-2 text-xl font-black tracking-[-.03em] text-[#043331]">{value}</p>
    </div>
  );
}

function commerceTone(status: AdvisorCommerceStatus): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (status === "requested" || status === "reviewing") return "teal";
  if (status === "payment_required") return "amber";
  if (status === "paid" || status === "confirmed" || status === "completed") return "emerald";
  if (status === "declined" || status === "cancelled") return "rose";
  return "neutral";
}

function bookingDateLabel(booking: AdvisorCommerceBooking) {
  if (booking.startDate && booking.endDate) {
    return `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;
  }
  if (booking.startDate) return formatDate(booking.startDate);
  return "Date pending";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
