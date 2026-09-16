"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  MapPinned,
  Ship,
  Sparkles,
  Users,
} from "lucide-react";

import { trackAcquisitionEvent } from "@/lib/acquisition-client";

const OPTIONS = [
  { id: "beach", label: "Beach day", detail: "Swim, relax and keep the schedule comfortable." },
  { id: "adventure", label: "Adventure", detail: "Snorkel, sail or add an active island experience." },
  { id: "culture", label: "History + culture", detail: "Charlotte Amalie, landmarks, local food and stories." },
  { id: "food", label: "Food + island life", detail: "A relaxed mix of local flavor, views and exploration." },
] as const;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatWindow(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function CruiseDayPlannerPage() {
  const [arrival, setArrival] = useState("08:00");
  const [departure, setDeparture] = useState("17:00");
  const [partySize, setPartySize] = useState("2");
  const [style, setStyle] = useState<(typeof OPTIONS)[number]["id"]>("beach");

  useEffect(() => {
    trackAcquisitionEvent("landing_view", { landing: "cruise-day-planner" });
  }, []);

  const plan = useMemo(() => {
    const arrivalMinutes = toMinutes(arrival);
    const departureMinutes = toMinutes(departure);
    const total = Math.max(0, departureMinutes - arrivalMinutes);
    const protectedReturn = Math.max(arrivalMinutes, departureMinutes - 90);
    const usable = Math.max(0, total - 120);
    const styleLabel = OPTIONS.find((option) => option.id === style)?.label ?? "Island day";

    return {
      total,
      protectedReturn,
      usable,
      styleLabel,
      arrivalLabel: formatWindow(arrivalMinutes),
      returnLabel: formatWindow(protectedReturn),
      valid: departureMinutes > arrivalMinutes,
    };
  }, [arrival, departure, style]);

  const conciergeHref = useMemo(() => {
    const prompt = [
      `I am a cruise passenger visiting St. Thomas. My ship arrives at ${plan.arrivalLabel} and departs at ${formatWindow(toMinutes(departure))}.`,
      `There are ${partySize} people. We want a ${plan.styleLabel.toLowerCase()}.`,
      `Build a practical port-day plan using the ship clock, transportation, realistic travel buffers, food options, and a protected return-to-ship window.`,
    ].join(" ");
    return `/concierge?open=true&prompt=${encodeURIComponent(prompt)}`;
  }, [departure, partySize, plan.arrivalLabel, plan.styleLabel]);

  function startPlanning() {
    trackAcquisitionEvent("intent_selected", {
      intent: "cruise-day-planner",
      arrival,
      departure,
      partySize: Number(partySize),
      style,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f4ea] text-[#07333d]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_15%,rgba(245,196,81,.34),transparent_28%),linear-gradient(145deg,#032f40,#075c60)] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pb-16">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="text-[10px] font-black uppercase tracking-[.18em] text-white/70 hover:text-white">USVI Explorer</Link>
            <Link href="/cruises" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[.14em]">Cruise Hub</Link>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.17em] text-[#f5c451]">
                <Ship className="h-4 w-4" /> Cruise-day planner
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[.9] tracking-[-.065em] sm:text-7xl">You have one island day. Make it count.</h1>
              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/70">Tell us your ship clock and what kind of day you want. USVI Explorer turns that into a practical St. Thomas plan with transportation, timing and a protected return window.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-[.13em] text-white/75">
                <span className="rounded-full bg-white/10 px-4 py-2">Ship clock first</span>
                <span className="rounded-full bg-white/10 px-4 py-2">Local mobility</span>
                <span className="rounded-full bg-white/10 px-4 py-2">AI Concierge</span>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[.08] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f5c451] text-[#07333d]"><CalendarClock className="h-5 w-5" /></span>
                <div><div className="text-sm font-black">Your port-day window</div><div className="text-xs font-semibold text-white/55">Start with the ship schedule.</div></div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <label className="rounded-2xl bg-white/[.08] p-3"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/45">Arrival</span><input aria-label="Ship arrival time" type="time" value={arrival} onChange={(event) => setArrival(event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" /></label>
                <label className="rounded-2xl bg-white/[.08] p-3"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/45">Departure</span><input aria-label="Ship departure time" type="time" value={departure} onChange={(event) => setDeparture(event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" /></label>
              </div>

              <label className="mt-3 block rounded-2xl bg-white/[.08] p-3"><span className="block text-[9px] font-black uppercase tracking-[.14em] text-white/45">Travelers</span><span className="mt-2 flex items-center gap-2"><Users className="h-4 w-4 text-[#f5c451]" /><select aria-label="Number of travelers" value={partySize} onChange={(event) => setPartySize(event.target.value)} className="w-full bg-transparent text-sm font-black outline-none"><option className="text-[#07333d]" value="1">1 traveler</option><option className="text-[#07333d]" value="2">2 travelers</option><option className="text-[#07333d]" value="3">3 travelers</option><option className="text-[#07333d]" value="4">4 travelers</option><option className="text-[#07333d]" value="5">5+ travelers</option></select></span></label>

              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-black/10 p-3"><Clock3 className="mx-auto h-4 w-4 text-[#f5c451]" /><div className="mt-1 text-lg font-black">{plan.valid ? `${Math.floor(plan.total / 60)}h ${plan.total % 60}m` : "—"}</div><div className="text-[8px] font-black uppercase tracking-[.13em] text-white/45">Port window</div></div>
                <div className="rounded-2xl bg-black/10 p-3"><MapPinned className="mx-auto h-4 w-4 text-[#f5c451]" /><div className="mt-1 text-lg font-black">{plan.valid ? plan.returnLabel : "Fix times"}</div><div className="text-[8px] font-black uppercase tracking-[.13em] text-white/45">Return buffer</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">Choose your day</p>
            <h2 className="mt-3 text-4xl font-black leading-[.95] tracking-[-.05em] sm:text-5xl">What do you want from St. Thomas?</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">This is the first decision in the planning journey. You can change everything later with Concierge.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((option) => {
              const active = option.id === style;
              return <button key={option.id} type="button" onClick={() => setStyle(option.id)} className={`text-left rounded-[26px] border p-5 transition ${active ? "border-teal-700 bg-[#e9f5f2] shadow-[0_16px_40px_rgba(4,51,49,.08)]" : "border-slate-200 bg-white hover:border-teal-700/30"}`}><span className="flex items-center justify-between gap-3"><span className="text-base font-black">{option.label}</span><span className={`grid h-8 w-8 place-items-center rounded-full ${active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"}`}>{active ? <CheckCircle2 className="h-4 w-4" /> : <Compass className="h-4 w-4" />}</span></span><span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{option.detail}</span></button>;
            })}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[32px] bg-white shadow-[0_20px_60px_rgba(4,51,49,.08)] ring-1 ring-slate-200">
          <div className="grid gap-0 lg:grid-cols-[1fr_.7fr]">
            <div className="p-6 sm:p-8">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Your starting brief</p>
              <h3 className="mt-3 text-3xl font-black tracking-[-.04em]">{plan.valid ? `${plan.styleLabel} for ${partySize} ${Number(partySize) === 1 ? "traveler" : "travelers"}` : "Check your ship times"}</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#f7f4ea] p-4"><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Arrive</div><div className="mt-1 font-black">{plan.arrivalLabel}</div></div>
                <div className="rounded-2xl bg-[#f7f4ea] p-4"><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Protected return</div><div className="mt-1 font-black">{plan.returnLabel}</div></div>
                <div className="rounded-2xl bg-[#f7f4ea] p-4"><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">Planning time</div><div className="mt-1 font-black">{plan.valid ? `${Math.floor(plan.usable / 60)}h ${plan.usable % 60}m` : "—"}</div></div>
              </div>
              <p className="mt-5 text-xs font-semibold leading-6 text-slate-500">The displayed return time is a conservative planning buffer, not an official all-aboard time. Final port-call and operator details should be verified before booking.</p>
            </div>
            <div className="flex flex-col justify-center bg-[#043331] p-6 text-white sm:p-8">
              <Sparkles className="h-6 w-6 text-[#f5c451]" />
              <h3 className="mt-4 text-2xl font-black tracking-[-.04em]">Now let Concierge finish the plan.</h3>
              <p className="mt-2 text-xs font-semibold leading-6 text-white/60">We pass your ship clock, group size and day style directly into the AI planning flow.</p>
              <Link href={plan.valid ? conciergeHref : "#ship-times"} onClick={plan.valid ? startPlanning : undefined} className={`mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[9px] font-black uppercase tracking-[.14em] ${plan.valid ? "bg-[#f5c451] text-[#043331]" : "bg-white/10 text-white/40"}`} aria-disabled={!plan.valid}>Build my port day <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/mobility" className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white/65">See mobility options <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
