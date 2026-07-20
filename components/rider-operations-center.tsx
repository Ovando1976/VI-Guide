"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import type { BookingStatus } from "@/types/mobility";
import type { RiderBookingOperations, RiderOperationsPayload } from "@/types/rider-operations";

const STEPS: BookingStatus[] = ["requested", "matched", "driver_en_route", "arrived", "in_progress", "completed"];
const ACTIVE = new Set<BookingStatus>(["requested", "matched", "driver_en_route", "arrived", "in_progress"]);

export function RiderOperationsCenter() {
  const [payload, setPayload] = useState<RiderOperationsPayload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/rider/operations", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to load rides.");
      setPayload(json as RiderOperationsPayload);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load rides.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const active = useMemo(
    () => (payload?.bookings ?? []).filter((item) => ACTIVE.has(item.booking.status)),
    [payload],
  );
  const history = useMemo(
    () => (payload?.bookings ?? []).filter((item) => !ACTIVE.has(item.booking.status)),
    [payload],
  );
  const selected =
    payload?.bookings.find((item) => item.booking.id === selectedId) ?? active[0] ?? history[0] ?? null;

  useEffect(() => {
    if (!selectedId && active[0]) setSelectedId(active[0].booking.id);
  }, [active, selectedId]);

  async function cancelRide(item: RiderBookingOperations) {
    const reason = window.prompt("Why are you cancelling? This note will be shared with dispatch.");
    if (reason === null) return;
    if (!window.confirm(`Cancel ${item.booking.origin.estateName} → ${item.booking.destination.estateName}?`)) return;
    try {
      setWorking(item.booking.id);
      const response = await fetch(`/api/bookings/${item.booking.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", message: reason.trim() || "Rider cancelled the trip." }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Unable to cancel this ride.");
      await load(true);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel this ride.");
    } finally {
      setWorking(null);
    }
  }

  if (loading) return <OperationsLoading />;

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-7 pb-36 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[32px] bg-[linear-gradient(135deg,#043331,#0f766e)] p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-[#f5c558]">Rider operations</div><h1 className="mt-2 text-4xl font-black italic tracking-[-.04em] sm:text-5xl">Your rides, without the guesswork.</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">Live driver progress, pickup context, official-rate review, and help in one place.</p></div>
            <div className="flex gap-2"><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.14em]"><RefreshCw className="h-4 w-4" /> Refresh</button><Link href="/plan" className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-4 py-3 text-[10px] font-black uppercase tracking-[.14em] text-[#043331]"><CalendarDays className="h-4 w-4" /> My plan</Link></div>
          </div>
        </header>

        {error ? <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800"><AlertCircle className="h-5 w-5" />{error}</div> : null}

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <RideList title="Active and upcoming" items={active} selectedId={selected?.booking.id ?? null} onSelect={setSelectedId} empty="No active rides. Prepare one from your itinerary or ask the Concierge." />
            <RideList title="Ride history" items={history.slice(0, 8)} selectedId={selected?.booking.id ?? null} onSelect={setSelectedId} empty="Completed and cancelled rides will appear here." />
          </div>

          {selected ? <RideDetail item={selected} working={working === selected.booking.id} onCancel={() => cancelRide(selected)} /> : <EmptyOperations />}
        </section>

        <RateReviewSection reviews={payload?.rateReviews ?? []} />
      </div>
    </main>
  );
}

function RideList({ title, items, selectedId, onSelect, empty }: { title: string; items: RiderBookingOperations[]; selectedId: string | null; onSelect: (id: string) => void; empty: string }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="px-2 pb-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">{title}</h2><div className="space-y-2">{items.length ? items.map((item) => <button key={item.booking.id} onClick={() => onSelect(item.booking.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === item.booking.id ? "border-teal-700 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}><div className="truncate text-sm font-black">{item.booking.origin.estateName} → {item.booking.destination.estateName}</div><div className="mt-2 flex items-center justify-between gap-2"><StatusLabel status={item.booking.status} /><span className="text-xs font-black">${item.booking.quotedFare.total.toFixed(2)}</span></div></button>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">{empty}</p>}</div></section>;
}

function RideDetail({ item, working, onCancel }: { item: RiderBookingOperations; working: boolean; onCancel: () => void }) {
  const { booking } = item;
  return <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"><div className="bg-[#043331] p-6 text-white sm:p-8"><div className="flex flex-wrap justify-between gap-4"><div><StatusLabel status={booking.status} inverse /><h2 className="mt-4 text-3xl font-black italic tracking-tight">{booking.origin.estateName} → {booking.destination.estateName}</h2><p className="mt-3 text-sm font-semibold text-white/70">{item.nextMessage}</p></div><div className="text-right"><div className="text-3xl font-black">${booking.quotedFare.total.toFixed(2)}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[.15em] text-white/55">Official tariff quote</div></div></div><Progress status={booking.status} /></div>
    <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-2">
      <InfoCard icon={MapPin} title="Pickup"><strong>{booking.origin.estateName}</strong><span>{booking.origin.notes || "Meet at the confirmed roadside pickup point."}</span></InfoCard>
      <InfoCard icon={Navigation} title="Destination"><strong>{booking.destination.estateName}</strong><span>{booking.passengers} passenger{booking.passengers === 1 ? "" : "s"} · {booking.luggage} bag{booking.luggage === 1 ? "" : "s"}</span></InfoCard>
      <InfoCard icon={UserRound} title="Driver"><strong>{item.driver?.name || "Assignment pending"}</strong><span>{item.driver?.rating ? `Rating ${item.driver.rating.toFixed(1)}` : "You will see the driver after compliant assignment."}</span></InfoCard>
      <InfoCard icon={Car} title="Vehicle"><strong>{[item.vehicle?.color, item.vehicle?.make, item.vehicle?.model].filter(Boolean).join(" ") || "Vehicle pending"}</strong><span>{item.vehicle?.taxiPlate ? `Taxi plate ${item.vehicle.taxiPlate}` : "Verify the displayed taxi plate before boarding."}</span></InfoCard>
    </div>
    <div className="border-t border-slate-100 p-5 sm:p-7"><h3 className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Trip activity</h3><div className="mt-4 space-y-3">{item.events.length ? item.events.map((event) => <div key={event.id} className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-600" /><div><div className="text-sm font-bold">{event.message}</div><div className="mt-1 text-[10px] font-semibold text-slate-400">{formatDate(event.createdAt)}</div></div></div>) : <p className="text-sm font-semibold text-slate-500">Trip activity will appear after the request is created.</p>}</div></div>
    <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 p-5 sm:p-7"><Link href={`/map?island=${booking.island}&concierge=open&prompt=${encodeURIComponent(`Help me with ride ${booking.id} from ${booking.origin.estateName} to ${booking.destination.estateName}. Do not change or cancel it without my confirmation.`)}`} className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white"><Sparkles className="h-4 w-4" /> Ask Concierge</Link>{item.canCancel ? <button disabled={working} onClick={onCancel} className="rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-rose-700 disabled:opacity-50">{working ? "Cancelling…" : "Cancel ride"}</button> : null}</div>
  </article>;
}

function Progress({ status }: { status: BookingStatus }) { const current = STEPS.indexOf(status); return <div className="mt-7 grid grid-cols-6 gap-1">{STEPS.map((step, index) => <div key={step}><div className={`h-1.5 rounded-full ${status !== "cancelled" && index <= current ? "bg-[#66e5d5]" : "bg-white/15"}`} /><div className="mt-1 truncate text-[7px] font-black uppercase tracking-[.08em] text-white/45">{step === "driver_en_route" ? "En route" : step}</div></div>)}</div>; }
function StatusLabel({ status, inverse = false }: { status: BookingStatus; inverse?: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] ${inverse ? "bg-white/10 text-white" : status === "cancelled" ? "bg-rose-100 text-rose-800" : status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-cyan-100 text-cyan-900"}`}>{status.replaceAll("_", " ")}</span>; }
function InfoCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-slate-400"><Icon className="h-4 w-4" />{title}</div><div className="mt-3 flex flex-col gap-1 text-sm"><>{children}</></div></div>; }
function RateReviewSection({ reviews }: { reviews: RiderOperationsPayload["rateReviews"] }) { if (!reviews.length) return null; return <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-800"><ShieldCheck className="h-4 w-4" /> Official-rate review</div><div className="mt-4 grid gap-3 md:grid-cols-2">{reviews.map((review) => <div key={review.id} className="rounded-2xl border border-amber-200 bg-white p-4"><div className="text-sm font-black">{review.originEstateName} → {review.destinationEstateName}</div><div className="mt-2 text-[9px] font-black uppercase tracking-[.14em] text-amber-700">{review.status}</div><p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{review.reason}</p></div>)}</div></section>; }
function EmptyOperations() { return <div className="grid min-h-96 place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white p-8 text-center"><div><CheckCircle2 className="mx-auto h-10 w-10 text-teal-700" /><h2 className="mt-4 text-2xl font-black">No ride needs attention.</h2><p className="mt-2 text-sm font-semibold text-slate-500">Plan the next connection or ask the Concierge to prepare it.</p><Link href="/plan" className="mt-5 inline-flex rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white">Open my plan</Link></div></div>; }
function OperationsLoading() { return <main className="grid min-h-screen place-items-center bg-[#f8f4ea]"><div className="text-center"><Clock3 className="mx-auto h-8 w-8 animate-pulse text-teal-700" /><div className="mt-3 text-sm font-black">Loading your rides…</div></div></main>; }
function formatDate(value: string) { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Pending"; }
