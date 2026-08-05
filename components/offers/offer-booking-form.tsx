"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Send,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { MerchantOfferBookingSnapshot } from "@/lib/merchant-offer-booking";

export function OfferBookingForm({
  offer,
}: {
  offer: MerchantOfferBookingSnapshot;
}) {
  const today = useMemo(() => getUsviToday(), []);
  const [form, setForm] = useState({
    startDate: today,
    endDate: offer.kind === "accommodation" ? addDays(today, 1) : "",
    preferredTime: "",
    adults: "2",
    children: "0",
    guestName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    reference: string;
    bookingId: string;
  } | null>(null);

  function patch(values: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...values }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/commerce-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.offerId,
          kind: offer.kind,
          listingId: offer.listingId,
          listingName: offer.listingName,
          island: offer.island,
          startDate: form.startDate,
          ...(form.endDate ? { endDate: form.endDate } : {}),
          ...(form.preferredTime
            ? { preferredTime: form.preferredTime }
            : {}),
          adults: Number(form.adults),
          children: Number(form.children),
          guestName: form.guestName,
          email: form.email,
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.notes ? { notes: form.notes } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            bookingId?: string;
            reference?: string;
            error?: string;
          }
        | null;
      if (!response.ok || !payload?.bookingId || !payload.reference) {
        throw new Error(payload?.error || "Unable to submit this booking request.");
      }
      setSuccess({
        bookingId: payload.bookingId,
        reference: payload.reference,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit this booking request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6 text-[#043331] shadow-sm sm:p-8">
        <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        <p className="mt-5 text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">
          Request received
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
          VI Guide sent the package request to operations.
        </h2>
        <p className="mt-4 text-sm font-semibold leading-7 text-emerald-950/70">
          Your reference is <strong>{success.reference}</strong>. The merchant will
          review timing and capacity before a secure deposit is requested.
        </p>
        <a
          href={`/bookings?booking=${encodeURIComponent(success.bookingId)}`}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#043331] px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"
        >
          Track this request
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 text-[#043331] shadow-sm sm:p-8">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
        Request this package
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
        Check availability with the merchant
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
        This is a request, not an instant charge. VI Guide verifies availability
        before sending a secure payment link.
      </p>

      {error ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Preferred date" icon={CalendarDays}>
          <input
            type="date"
            min={today}
            value={form.startDate}
            onChange={(event) => {
              const startDate = event.target.value;
              patch({
                startDate,
                ...(offer.kind === "accommodation" &&
                (!form.endDate || form.endDate <= startDate)
                  ? { endDate: addDays(startDate, 1) }
                  : {}),
              });
            }}
            className={inputClass()}
          />
        </Field>
        {offer.kind === "accommodation" ? (
          <Field label="Check-out date" icon={CalendarDays}>
            <input
              type="date"
              min={addDays(form.startDate || today, 1)}
              value={form.endDate}
              onChange={(event) => patch({ endDate: event.target.value })}
              className={inputClass()}
            />
          </Field>
        ) : (
          <Field label="Preferred time" icon={CalendarDays}>
            <input
              type="time"
              value={form.preferredTime}
              onChange={(event) => patch({ preferredTime: event.target.value })}
              className={inputClass()}
            />
          </Field>
        )}
        <Field label="Adults" icon={Users}>
          <input
            type="number"
            min={1}
            max={20}
            value={form.adults}
            onChange={(event) => patch({ adults: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Children" icon={Users}>
          <input
            type="number"
            min={0}
            max={20}
            value={form.children}
            onChange={(event) => patch({ children: event.target.value })}
            className={inputClass()}
          />
        </Field>
        <Field label="Guest name">
          <input
            value={form.guestName}
            onChange={(event) => patch({ guestName: event.target.value })}
            maxLength={160}
            className={inputClass()}
            placeholder="Full name"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(event) => patch({ email: event.target.value })}
            maxLength={220}
            className={inputClass()}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => patch({ phone: event.target.value })}
            maxLength={40}
            className={inputClass()}
            placeholder="(340) 555-0123"
          />
        </Field>
        <div className="hidden sm:block" />
        <div className="sm:col-span-2">
          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              maxLength={1600}
              rows={4}
              className={inputClass("py-3")}
              placeholder="Pickup details, accessibility needs, celebration notes, or questions"
            />
          </Field>
        </div>
      </div>

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.15em] text-[#043331] disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send booking request
      </button>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: typeof CalendarDays;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
      <span className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-teal-700" /> : null}
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function getUsviToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inputClass(extra = "") {
  return `min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600 ${extra}`;
}
