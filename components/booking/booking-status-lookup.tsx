"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { BookingActivityFeed } from "@/components/booking/booking-activity-feed";
import type {
  CommerceBookingKind,
  CommerceBookingStatus,
} from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

type BookingStatusResult = {
  reference: string;
  status: CommerceBookingStatus;
  kind: CommerceBookingKind;
  listingName: string;
  island: IntelligenceIsland;
  startDate: string;
  endDate: string | null;
  preferredTime: string | null;
  adults: number;
  children: number;
  updatedAt: string;
  merchantNote?: string | null;
  proposedTime?: string | null;
};

const ISLAND_NAMES: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const STATUS_COPY: Record<CommerceBookingStatus, { title: string; detail: string }> = {
  draft: { title: "Draft", detail: "This request has not been submitted yet." },
  requested: { title: "Request received", detail: "VI Guide has recorded the request and it is waiting for review." },
  reviewing: { title: "Under review", detail: "Availability and request details are currently being reviewed." },
  confirmed: { title: "Confirmed", detail: "The booking request has been confirmed. Follow the provided payment or operator instructions." },
  declined: { title: "Unavailable", detail: "The requested booking could not be confirmed. Concierge can help find an alternative." },
  cancelled: { title: "Cancelled", detail: "This booking request has been cancelled." },
};

export function BookingStatusLookup() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<BookingStatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (silent = false) => {
    if (!reference || !email) return;
    if (!silent) {
      setLoading(true);
      setError(null);
      setBooking(null);
    }

    try {
      const response = await fetch("/api/commerce-bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { booking?: BookingStatusResult; error?: string }
        | null;
      if (!response.ok || !payload?.booking) {
        throw new Error(payload?.error || "Unable to find this booking request.");
      }
      setBooking(payload.booking);
    } catch (lookupError) {
      if (!silent) {
        setError(lookupError instanceof Error ? lookupError.message : "Unable to find this booking request.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [email, reference]);

  useEffect(() => {
    if (!booking) return;
    const timer = window.setInterval(() => void lookup(true), 15_000);
    return () => window.clearInterval(timer);
  }, [booking, lookup]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    await lookup(false);
  }

  const statusCopy = booking ? STATUS_COPY[booking.status] ?? STATUS_COPY.requested : null;

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/experiences" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.16em]">
          <ArrowLeft className="h-4 w-4" /> Booking marketplace
        </Link>

        <section className="mt-5 overflow-hidden rounded-[36px] bg-[#043331] text-white shadow-[0_30px_80px_rgba(4,51,49,.18)]">
          <div className="grid lg:grid-cols-[.85fr_1.15fr]">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,.25),transparent_38%),linear-gradient(145deg,#043331,#075e58)] p-7 sm:p-10">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]"><BadgeCheck className="h-4 w-4" /> Booking status</div>
              <h1 className="mt-5 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-5xl">Track your VI Guide request.</h1>
              <p className="mt-5 text-sm font-semibold leading-7 text-white/65">Enter the reference from your confirmation screen and the email used when submitting the request.</p>
              <div className="mt-8 flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs font-semibold leading-5 text-white/65"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7ce0d4]" /><span>Only limited booking details are returned after the reference and email match.</span></div>
            </div>

            <div className="bg-white p-6 text-[#043331] sm:p-8 lg:p-10">
              <form onSubmit={submit}>
                <label className="block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Booking reference
                  <input required value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 py-3 font-mono text-sm font-black uppercase outline-none focus:border-teal-600/40 focus:ring-4 focus:ring-teal-600/10" placeholder="VI-STAY-..." />
                </label>
                <label className="mt-5 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Email
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 py-3 focus-within:border-teal-600/40 focus-within:ring-4 focus-within:ring-teal-600/10">
                    <Mail className="h-4 w-4 text-teal-700" />
                    <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="name@example.com" />
                  </div>
                </label>

                {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{error}</div> : null}

                <button type="submit" disabled={loading} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f5b942] px-6 text-[11px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:bg-[#ffca55] disabled:opacity-50">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />} Check status
                </button>
              </form>

              {booking && statusCopy ? (
                <section className="mt-7 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">{booking.status === "confirmed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">{booking.reference}</p>
                      <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">{statusCopy.title}</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950/70">{statusCopy.detail}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Detail label="Booking" value={booking.listingName} />
                    <Detail label="Island" value={ISLAND_NAMES[booking.island] ?? booking.island} />
                    <Detail label="Date" value={booking.endDate ? `${booking.startDate} → ${booking.endDate}` : booking.startDate} icon={CalendarDays} />
                    <Detail label="Party" value={`${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? ` · ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`} icon={Users} />
                  </div>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Link href="/planner" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.15em] text-white">Open my trip</Link>
                    <Link href={`/concierge?prompt=${encodeURIComponent(`Help me with booking ${booking.reference} for ${booking.listingName}. The current status is ${booking.status}.`)}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-emerald-300 bg-white px-5 text-[10px] font-black uppercase tracking-[.15em]">Ask concierge</Link>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </section>

        {booking ? <div className="mt-6"><BookingActivityFeed activities={[booking]} /></div> : null}
      </div>
    </main>
  );
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof CalendarDays }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">{Icon ? <Icon className="h-3.5 w-3.5" /> : null} {label}</div>
      <div className="mt-2 text-sm font-black">{value}</div>
    </div>
  );
}
