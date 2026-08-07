"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Loader2,
  Mail,
  MapPinned,
  Phone,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  addCalendarDays,
  getUsviToday,
  isBookableEndDate,
  isBookableStartDate,
} from "@/lib/booking/booking-dates";
import { buildBookingPlannerHref } from "@/lib/booking/booking-planner-handoff";
import {
  buildBookingStatusHref,
  rememberTrackedBooking,
} from "@/lib/booking/booking-tracker";
import type { CommerceBookingKind } from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

const ISLAND_NAMES: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export function CommerceBookingExperience() {
  const params = useSearchParams();
  const kind = normalizeKind(params.get("kind"));
  const island = normalizeIsland(params.get("island"));
  const listingId = cleanParam(params.get("listingId")) || "custom-request";
  const listingName =
    cleanParam(params.get("listingName")) || "VI Guide experience";
  const listingHref = cleanParam(params.get("listingHref"));
  const proposalShareId = normalizeProposalShareId(params.get("proposal"));
  const today = getUsviToday();
  const requestedStart = cleanDate(params.get("startDate"));
  const initialStart = isBookableStartDate(requestedStart, today)
    ? requestedStart
    : "";
  const requestedEnd = cleanDate(params.get("endDate"));
  const initialEnd = isBookableEndDate(initialStart, requestedEnd)
    ? requestedEnd
    : "";
  const initialAdults = clamp(Number(params.get("adults")) || 2, 1, 20);

  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [preferredTime, setPreferredTime] = useState("");
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    bookingId: string;
    reference: string;
  } | null>(null);

  const minimumEndDate = addCalendarDays(startDate || today, 1);
  const title = useMemo(() => {
    if (kind === "accommodation") return "Request this stay";
    if (kind === "tour") return "Request this tour";
    return "Request this experience";
  }, [kind]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!isBookableStartDate(startDate, today)) {
      setError("Choose today or a future date for this request.");
      return;
    }

    if (
      kind === "accommodation" &&
      !isBookableEndDate(startDate, endDate)
    ) {
      setError("Check-out must be at least one day after check-in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          island,
          listingId,
          listingName,
          listingHref: listingHref || undefined,
          proposalShareId: proposalShareId || undefined,
          startDate,
          endDate: kind === "accommodation" ? endDate : undefined,
          preferredTime: kind === "accommodation" ? undefined : preferredTime,
          adults,
          children,
          guestName,
          email,
          phone,
          notes,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { bookingId?: string; reference?: string; error?: string }
        | null;

      if (!response.ok || !payload?.bookingId || !payload.reference) {
        throw new Error(
          payload?.error || "VI Guide could not submit this request.",
        );
      }

      rememberTrackedBooking({
        bookingId: payload.bookingId,
        reference: payload.reference,
        email,
        status: "requested",
        kind,
        island,
        listingId,
        listingName,
        startDate,
        ...(kind === "accommodation" ? { endDate } : {}),
        ...(listingHref ? { listingHref } : {}),
        updatedAt: new Date().toISOString(),
      });
      setConfirmation({
        bookingId: payload.bookingId,
        reference: payload.reference,
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "VI Guide could not submit this request.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    const plannerHref = buildBookingPlannerHref({
      reference: confirmation.reference,
      kind,
      island,
      listingId,
      listingName,
      startDate,
      ...(kind === "accommodation" ? { endDate } : {}),
      ...(listingHref ? { listingHref } : {}),
    });
    const statusHref = buildBookingStatusHref(confirmation.reference);

    return (
      <main className="min-h-screen bg-[#f8f4ea] px-4 py-10 text-[#043331] sm:px-6">
        <section className="mx-auto max-w-2xl rounded-[36px] border border-emerald-200 bg-white p-7 text-center shadow-[0_30px_80px_rgba(4,51,49,.12)] sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[.22em] text-emerald-700">
            Booking request received
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">
            Your request is in review.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-600">
            VI Guide recorded your request for {listingName}. This is not yet a
            confirmed reservation. Availability, confirmation, and any payment
            instructions will follow after review.
          </p>

          {proposalShareId ? (
            <div className="mx-auto mt-5 flex max-w-lg items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-left text-xs font-semibold leading-5 text-teal-900">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This booking request is linked back to the Travel Advisor proposal you opened, so the advisor workflow can follow the request without placing your contact details in the proposal link.
              </span>
            </div>
          ) : null}

          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-[#edf6f2] p-5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
              Booking reference
            </div>
            <div className="mt-2 font-mono text-lg font-black">
              {confirmation.reference}
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={plannerHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white"
            >
              <MapPinned className="h-4 w-4" /> Plan around this request
            </Link>
            <Link
              href={statusHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-[.16em]"
            >
              <ClipboardCheck className="h-4 w-4" /> Check request status
            </Link>
          </div>

          <p className="mx-auto mt-5 max-w-lg text-xs font-semibold leading-5 text-slate-500">
            This device remembers the reference and lookup email so the status
            page can reopen the request automatically. You can remove that saved
            access from the status page at any time. Contact details are never
            placed in the planner link.
          </p>
        </section>
      </main>
    );
  }

  const backHref = listingHref || (proposalShareId ? `/shared-trip/${proposalShareId}` : "/");

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.16em]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <section className="mt-5 overflow-hidden rounded-[36px] bg-[#043331] text-white shadow-[0_30px_80px_rgba(4,51,49,.18)]">
          <div className="grid lg:grid-cols-[.8fr_1.2fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,.25),transparent_36%),linear-gradient(145deg,#043331,#075e58)] p-7 sm:p-10">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                <BadgeCheck className="h-4 w-4" /> VI Guide booking
              </div>
              {proposalShareId ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-[#7ce0d4]">
                  <FileCheck2 className="h-3.5 w-3.5" /> From Travel Advisor proposal
                </div>
              ) : null}
              <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 text-lg font-black">{listingName}</p>
              <p className="mt-2 text-sm font-semibold text-white/60">
                {ISLAND_NAMES[island]}
              </p>
              <div className="mt-8 space-y-4 text-sm font-semibold leading-6 text-white/68">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7ce0d4]" />
                  <span>
                    VI Guide records a real request without presenting
                    unverified availability, confirmation, or pricing.
                  </span>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#7ce0d4]" />
                  <span>
                    Your contact information is used only to follow up on this
                    request and is not sent into the trip planner or public proposal.
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={submit}
              className="bg-white p-6 text-[#043331] sm:p-8 lg:p-10"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label={kind === "accommodation" ? "Check-in" : "Date"}
                  icon={CalendarDays}
                >
                  <input
                    required
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(event) => {
                      const nextStartDate = event.target.value;
                      setStartDate(nextStartDate);
                      if (
                        endDate &&
                        !isBookableEndDate(nextStartDate, endDate)
                      ) {
                        setEndDate("");
                      }
                    }}
                    className="field-input"
                  />
                </Field>

                {kind === "accommodation" ? (
                  <Field label="Check-out" icon={CalendarDays}>
                    <input
                      required
                      type="date"
                      min={minimumEndDate || undefined}
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="field-input"
                    />
                  </Field>
                ) : (
                  <Field label="Preferred time" icon={CalendarDays}>
                    <input
                      type="time"
                      value={preferredTime}
                      onChange={(event) => setPreferredTime(event.target.value)}
                      className="field-input"
                    />
                  </Field>
                )}

                <Field label="Adults" icon={Users}>
                  <input
                    required
                    type="number"
                    min={1}
                    max={20}
                    value={adults}
                    onChange={(event) =>
                      setAdults(clamp(Number(event.target.value), 1, 20))
                    }
                    className="field-input"
                  />
                </Field>

                <Field label="Children" icon={Users}>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={children}
                    onChange={(event) =>
                      setChildren(clamp(Number(event.target.value), 0, 20))
                    }
                    className="field-input"
                  />
                </Field>

                <Field label="Full name" icon={Users} wide>
                  <input
                    required
                    autoComplete="name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    className="field-input"
                    placeholder="Guest name"
                  />
                </Field>

                <Field label="Email" icon={Mail}>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field-input"
                    placeholder="name@example.com"
                  />
                </Field>

                <Field label="Phone" icon={Phone}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="field-input"
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <label className="mt-5 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                Notes or requests
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={1600}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 py-3 text-sm font-semibold normal-case tracking-normal outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10"
                  placeholder="Arrival details, accessibility needs, room preferences, or questions…"
                />
              </label>

              {error ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5b942] px-6 text-[11px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:bg-[#ffca55] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                Submit booking request
              </button>

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-500">
                Submission does not guarantee availability or create a charge.
              </p>
            </form>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .field-input {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: #fbfaf6;
          padding: 0.8rem 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          outline: none;
        }
        .field-input:focus {
          border-color: rgba(13, 148, 136, 0.5);
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  icon: Icon,
  wide = false,
  children,
}: {
  label: string;
  icon: typeof CalendarDays;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`text-[10px] font-black uppercase tracking-[.16em] text-slate-500 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </span>
      {children}
    </label>
  );
}

function normalizeKind(value: string | null): CommerceBookingKind {
  return value === "tour" || value === "experience"
    ? value
    : "accommodation";
}

function normalizeIsland(value: string | null): IntelligenceIsland {
  return value === "stj" || value === "stx" ? value : "stt";
}

function normalizeProposalShareId(value: string | null) {
  const shareId = value?.trim() ?? "";
  return /^[a-f0-9]{24}$/.test(shareId) ? shareId : "";
}

function cleanParam(value: string | null) {
  return value?.trim().slice(0, 500) ?? "";
}

function cleanDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function clamp(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
