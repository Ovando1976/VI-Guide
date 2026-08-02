"use client";

import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CommerceBooking,
  CommerceBookingStatus,
} from "@/types/commerce-booking";

const STATUS_OPTIONS: CommerceBookingStatus[] = [
  "requested",
  "reviewing",
  "confirmed",
  "declined",
  "cancelled",
];

export function CommerceBookingReview() {
  const [bookings, setBookings] = useState<CommerceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CommerceBookingStatus>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/commerce-bookings", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: CommerceBooking[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load booking requests.");
      }
      const loadedBookings = payload?.bookings;
      setBookings(Array.isArray(loadedBookings) ? loadedBookings : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load booking requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (!normalized) return true;
      return [
        booking.reference,
        booking.listingName,
        booking.guestName,
        booking.email,
        booking.phone,
        booking.kind,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [bookings, query, statusFilter]);

  async function updateBooking(
    bookingId: string,
    status: CommerceBookingStatus,
    internalNote: string,
  ) {
    setSavingId(bookingId);
    setError(null);
    try {
      const response = await fetch("/api/admin/commerce-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status, internalNote }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update booking status.");
      }
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status, updatedAt: new Date().toISOString() }
            : booking,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update booking status.",
      );
    } finally {
      setSavingId(null);
    }
  }

  const counts = useMemo(
    () =>
      STATUS_OPTIONS.reduce<Record<string, number>>((result, status) => {
        result[status] = bookings.filter((booking) => booking.status === status).length;
        return result;
      }, {}),
    [bookings],
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-[36px] bg-[#043331] p-7 text-white shadow-[0_30px_80px_rgba(4,51,49,.2)] sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                <ShieldCheck className="h-4 w-4" /> Authorized operations
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Booking review
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/65">
                Review accommodation, tour, and experience requests, record an internal note, and move each request through a clear customer-visible status.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-[10px] font-black uppercase tracking-[.16em]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-[24px] border p-5 text-left transition ${
                statusFilter === status
                  ? "border-teal-700 bg-[#edf6f2]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                {status}
              </div>
              <div className="mt-2 text-3xl font-black">{counts[status] ?? 0}</div>
            </button>
          ))}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reference, guest, email, or listing"
                className="min-h-12 w-full bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | CommerceBookingStatus)
              }
              className="min-h-12 rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 text-sm font-black outline-none"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              className="min-h-12 rounded-full border border-slate-200 px-5 text-[10px] font-black uppercase tracking-[.15em]"
            >
              Clear
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white p-12 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading booking requests…
          </div>
        ) : null}

        {!loading && !filtered.length ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <BadgeCheck className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-black">No matching booking requests</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingReviewCard
              key={booking.id}
              booking={booking}
              saving={savingId === booking.id}
              onSave={updateBooking}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function BookingReviewCard({
  booking,
  saving,
  onSave,
}: {
  booking: CommerceBooking;
  saving: boolean;
  onSave: (
    bookingId: string,
    status: CommerceBookingStatus,
    internalNote: string,
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState<CommerceBookingStatus>(booking.status);
  const [internalNote, setInternalNote] = useState("");

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            <span className="rounded-full bg-slate-100 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
              {booking.kind}
            </span>
            <span className="font-mono text-xs font-black text-teal-800">
              {booking.reference}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">
            {booking.listingName}
          </h2>
          <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600 sm:grid-cols-2">
            <Info icon={Users} label={booking.guestName} />
            <Info icon={Mail} label={booking.email} />
            <Info
              icon={CalendarDays}
              label={`${booking.startDate}${booking.endDate ? ` → ${booking.endDate}` : ""}`}
            />
            <Info
              icon={Clock3}
              label={`${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? ` · ${booking.children} children` : ""}`}
            />
          </div>
          {booking.notes ? (
            <div className="mt-5 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-semibold leading-6 text-slate-600">
              {booking.notes}
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] bg-[#edf6f2] p-5">
          <label className="text-[9px] font-black uppercase tracking-[.16em] text-teal-800">
            Customer-visible status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CommerceBookingStatus)
              }
              className="mt-2 min-h-12 w-full rounded-2xl border border-teal-900/10 bg-white px-4 text-sm font-black normal-case tracking-normal outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-[9px] font-black uppercase tracking-[.16em] text-teal-800">
            Internal note
            <textarea
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
              maxLength={1600}
              rows={4}
              placeholder="Availability check, operator contact, follow-up details…"
              className="mt-2 w-full rounded-2xl border border-teal-900/10 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal outline-none"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(booking.id, status, internalNote)}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.16em] text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Save review
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: CommerceBookingStatus }) {
  const declined = status === "declined" || status === "cancelled";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] ${
        declined
          ? "bg-rose-100 text-rose-800"
          : status === "confirmed"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
      }`}
    >
      {declined ? <CircleX className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function Info({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-teal-700" />
      <span className="truncate">{label}</span>
    </div>
  );
}
