"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AddToTripButton } from "@/components/trip-planner/add-to-trip-button";

type Props = {
  name: string;
  website?: string;
  island: string;
  location?: string;
  id: string;
  slug: string;
  islandCode: "stt" | "stj" | "stx";
  image?: string;
  description?: string;
};

export function StayActionCard({ name, website, island, location, id, slug, islandCode, image, description }: Props) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const conciergeHref = useMemo(() => {
    const prompt = `Help me plan a stay at ${name}${location ? ` in ${location}` : ""} on ${island}. I am considering ${guests} guest${guests === 1 ? "" : "s"}${checkIn ? ` from ${checkIn}` : ""}${checkOut ? ` to ${checkOut}` : ""}. Include transportation, nearby beaches, dining, and practical arrival advice.`;
    return `/map?concierge=open&prompt=${encodeURIComponent(prompt)}`;
  }, [name, location, island, guests, checkIn, checkOut]);

  return (
    <aside className="stay-action-card rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_rgba(4,51,49,.12)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-amber-600">Plan this stay</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">Build your island arrival</h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><CalendarDays size={20} /></span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
          Check-in
          <span className="mt-2 flex w-full min-w-0 rounded-2xl border border-slate-200 bg-[#f8f4ea] px-3 py-3">
            <input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-[#043331] outline-none" />
          </span>
        </label>
        <label className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
          Check-out
          <span className="mt-2 flex w-full min-w-0 rounded-2xl border border-slate-200 bg-[#f8f4ea] px-3 py-3">
            <input type="date" value={checkOut} min={checkIn || undefined} onChange={(event) => setCheckOut(event.target.value)} className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-[#043331] outline-none" />
          </span>
        </label>
      </div>

      <label className="mt-3 block text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
        Guests
        <span className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3">
          <Users size={17} className="text-[#0f766e]" />
          <select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="w-full bg-transparent text-sm font-black text-[#043331] outline-none">
            {[1,2,3,4,5,6,7,8].map((value) => <option key={value} value={value}>{value} guest{value === 1 ? "" : "s"}</option>)}
          </select>
        </span>
      </label>

      <div className="mt-5 grid gap-3">
        <AddToTripButton item={{ id, slug, name, kind: "stay", island: islandCode, image, description, location, href: `/accommodations/${slug}` }} />
        {website ? (
          <a href={website} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 py-3 text-[11px] font-black uppercase tracking-[.17em] text-white transition hover:bg-[#0b5d5b]">
            Check official availability <ExternalLink size={16} />
          </a>
        ) : null}
        <Link href={conciergeHref} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#f5b942] px-5 py-3 text-[11px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:bg-[#ffca55]">
          Plan with concierge <Sparkles size={16} />
        </Link>
        <Link href="/mobility" className="inline-flex min-h-13 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:border-[#0f766e]">
          Arrange airport or ferry ride
        </Link>
      </div>

      <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Availability and payment remain with the property. VI Guide helps you compare, plan, and connect your trip without presenting an unverified price.</span>
      </div>
    </aside>
  );
}
