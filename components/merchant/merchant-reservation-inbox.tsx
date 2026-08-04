"use client";

import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
};

type Filter = "active" | "confirmed" | "closed" | "all";

export function MerchantReservationInbox() {
  const [bookings, setBookings] = useState<MerchantBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: MerchantBooking[]; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to load reservations.");
      setBookings(payload?.bookings ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const visible = useMemo(() => {
    return bookings.filter((booking) => {
      if (filter === "all") return true;
      if (filter === "active") return ["requested", "reviewing"].includes(booking.status);
      if (filter === "confirmed") return booking.status === "confirmed";
      return ["declined", "cancelled"].includes(booking.status);
    });
  }, [bookings, filter]);

  async function updateBooking(
    booking: MerchantBooking,
    status: CommerceBookingStatus,
    merchantNote?: string,
    proposedTime?: string,
  ) {
    setSavingId(booking.id);
    setError(null);
    try {
      const response = await fetch(`/api/merchant-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, merchantNote, proposedTime }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { booking?: Partial<MerchantBooking>; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to update booking.");
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...payload?.booking } : item,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update booking.");
    } finally {
      setSavingId(null);
    }
  }

  const counts = {
    active: bookings.filter((booking) => ["requested", "reviewing"].includes(booking.status)).length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    closed: bookings.filter((booking) => ["declined", "cancelled"].includes(booking.status)).length,
    all: bookings.length,
  };

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">Business Operations</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Reservation Inbox</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Review traveler requests, confirm bookings, decline unavailable dates, or propose a better time.
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

        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          {(["active", "confirmed", "closed", "all"] as Filter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-[24px] border p-5 text-left shadow-sm transition ${
                filter === item
                  ? "border-[#043331] bg-[#043331] text-white"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-2xl font-black">{counts[item]}</p>
              <p className={`mt-1 text-[9px] font-black uppercase tracking-[.15em] ${filter === item ? "text-white/55" : "text-slate-400"}`}>
                {item === "active" ? "Needs action" : item}
              </p>
            </button>
          ))}
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
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
              <h2 className="mt-4 text-2xl font-black">No reservations in this view</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">New traveler requests will appear here automatically.</p>
            </div>
          )}
        </section>
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
    status: CommerceBookingStatus,
    merchantNote?: string,
    proposedTime?: string,
  ) => Promise<void>;
}) {
  const [note, setNote] = useState(booking.merchantNote ?? "");
  const [proposedTime, setProposedTime] = useState(booking.proposedTime ?? booking.preferredTime ?? "");

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">{booking.reference}</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{booking.listingName}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {booking.guestName} · {booking.adults + booking.children} guests · {booking.startDate}
            {booking.endDate ? ` to ${booking.endDate}` : ""}
          </p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-[#f8f4ea] p-4 text-xs font-semibold text-slate-600 sm:grid-cols-3">
        <div><strong className="block text-[#043331]">Contact</strong>{booking.email}{booking.phone ? ` · ${booking.phone}` : ""}</div>
        <div><strong className="block text-[#043331]">Preferred time</strong>{booking.preferredTime || "Not specified"}</div>
        <div><strong className="block text-[#043331]">Traveler notes</strong>{booking.notes || "None"}</div>
      </div>

      {booking.status === "requested" || booking.status === "reviewing" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px]">
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Message for traveler
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600"
              placeholder="Add confirmation details or explain the change."
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Alternate time
            <input
              value={proposedTime}
              onChange={(event) => setProposedTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600"
              placeholder="2:30 PM"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {(booking.status === "requested" || booking.status === "reviewing") ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onUpdate(booking, "confirmed", note)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm
            </button>
            <button
              type="button"
              disabled={saving || !proposedTime.trim()}
              onClick={() => void onUpdate(booking, "reviewing", note, proposedTime)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
            >
              <Clock3 className="h-4 w-4" /> Propose time
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onUpdate(booking, "declined", note)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-[9px] font-black uppercase tracking-[.14em] text-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Decline
            </button>
          </>
        ) : null}
        {booking.merchantNote ? (
          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
            <MessageSquareText className="h-4 w-4" /> Traveler message saved
          </span>
        ) : null}
        {saving ? <Loader2 className="h-5 w-5 animate-spin self-center text-teal-700" /> : null}
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: CommerceBookingStatus }) {
  const label = status === "requested" ? "New request" : status;
  const className =
    status === "confirmed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "declined" || status === "cancelled"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  return (
    <span className={`rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] ${className}`}>
      {label}
    </span>
  );
}
