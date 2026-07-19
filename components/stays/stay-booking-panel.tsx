"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Loader2, LockKeyhole, Minus, Plus, Users } from "lucide-react";

import { useAuth } from "@/components/auth-provider";

type Props = { stay: { slug: string; name: string; islandName: string; website?: string; phone?: string } };

function dateValue(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function StayBookingPanel({ stay }: Props) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(dateValue(14));
  const [checkOut, setCheckOut] = useState(dateValue(17));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const nights = useMemo(() => Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)), [checkIn, checkOut]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!user) { router.push("/login"); return; }
    if (!nights) { setError("Check-out must be after check-in."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/stays/booking-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ staySlug: stay.slug, checkIn, checkOut, adults, children, rooms, phone, notes }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to send request.");
      setConfirmation(body.requestId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to send request."); }
    finally { setSubmitting(false); }
  }

  if (confirmation) return <aside className="rounded-[30px] border border-emerald-200 bg-white p-7 shadow-[0_22px_60px_rgba(4,51,49,.13)] lg:sticky lg:top-8"><CheckCircle2 className="h-12 w-12 text-emerald-600" /><div className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-emerald-700">Request received</div><h2 className="mt-2 text-2xl font-black tracking-tight">Your stay request is in.</h2><p className="mt-3 text-sm font-medium leading-6 text-slate-600">This is pending property confirmation. Keep this reference:</p><div className="mt-4 rounded-2xl bg-[#f7f4ed] p-4 font-mono text-sm font-bold">{confirmation}</div><Link href="/trips" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-teal-800">View my trips <ArrowRight className="h-4 w-4" /></Link></aside>;

  return <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(4,51,49,.13)] lg:sticky lg:top-8 sm:p-7">
    <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#b65f12]">Plan your stay</div>
    <h2 className="mt-2 text-2xl font-black tracking-tight">Request availability</h2>
    <p className="mt-2 text-xs font-medium leading-5 text-slate-500">No charge today. The property must confirm availability and rates.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200">
        <DateField label="Check in" value={checkIn} onChange={setCheckIn} min={dateValue(0)} />
        <DateField label="Check out" value={checkOut} onChange={setCheckOut} min={checkIn} border />
      </div>
      <div className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400"><Users className="h-4 w-4" /> Guests and rooms</div><Counter label="Adults" value={adults} setValue={setAdults} min={1} /><Counter label="Children" value={children} setValue={setChildren} min={0} /><Counter label="Rooms" value={rooms} setValue={setRooms} min={1} /></div>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact phone (optional)" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-700" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requests (optional)" rows={3} className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-teal-700" />
      <div className="flex items-center justify-between rounded-2xl bg-[#f7f4ed] px-4 py-3"><span className="text-xs font-bold text-slate-500">Length of stay</span><strong>{nights} {nights === 1 ? "night" : "nights"}</strong></div>
      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
      <button disabled={submitting || authLoading} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[11px] font-black uppercase tracking-[.18em] text-white disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}{user ? "Request to book" : "Sign in to request"}</button>
    </form>
    <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400"><LockKeyhole className="h-3.5 w-3.5" />Your request is sent securely</div>
    {stay.website ? <a href={stay.website} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-[.16em]">Book directly with property <ExternalLink className="h-4 w-4" /></a> : null}
  </aside>;
}

function DateField({ label, value, onChange, min, border }: { label: string; value: string; onChange: (value: string) => void; min: string; border?: boolean }) { return <label className={`p-3 ${border ? "border-l border-slate-200" : ""}`}><span className="block text-[9px] font-black uppercase tracking-[.17em] text-slate-400">{label}</span><input type="date" required min={min} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-transparent text-xs font-black outline-none" /></label>; }
function Counter({ label, value, setValue, min }: { label: string; value: number; setValue: (value: number) => void; min: number }) { return <div className="flex items-center justify-between border-t border-slate-100 py-2.5 first:border-0"><span className="text-sm font-bold">{label}</span><div className="flex items-center gap-3"><button type="button" aria-label={`Remove ${label}`} onClick={() => setValue(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200"><Minus className="h-3.5 w-3.5" /></button><span className="w-4 text-center text-sm font-black">{value}</span><button type="button" aria-label={`Add ${label}`} onClick={() => setValue(Math.min(12, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200"><Plus className="h-3.5 w-3.5" /></button></div></div>; }
