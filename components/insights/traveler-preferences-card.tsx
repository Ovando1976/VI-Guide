"use client";

import { CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import {
  hasCustomerInsightConsent,
  recordCustomerInsight,
  setCustomerInsightConsent,
} from "@/lib/customer-insights-client";

const STORAGE_KEY = "vi-guide.traveler-intent.v1";
const OUTCOMES = ["relaxing", "adventurous", "romantic", "family", "food", "local", "accessible", "budget", "luxury", "avoid_crowds"];

export function TravelerPreferencesCard() {
  const [purpose, setPurpose] = useState("vacation");
  const [outcome, setOutcome] = useState("relaxing");
  const [transport, setTransport] = useState("taxi");
  const [budget, setBudget] = useState("value");
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConsent(hasCustomerInsightConsent());
    try {
      const current = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Record<string, string> | null;
      if (current) {
        setPurpose(current.purpose || "vacation"); setOutcome(current.outcome || "relaxing");
        setTransport(current.transport || "taxi"); setBudget(current.budget || "value");
      }
    } catch {}
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ purpose, outcome, transport, budget }));
    setCustomerInsightConsent(consent);
    if (consent) await recordCustomerInsight("trip_intent_saved", { purpose, outcome, transport, budget });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section className="mt-6 rounded-[30px] border border-teal-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal-700"><SlidersHorizontal className="h-5 w-5" /></span>
        <div><p className="text-[9px] font-black uppercase tracking-[.17em] text-teal-700">Make VI Guide fit you</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em]">What should this trip feel like?</h2><p className="mt-1 text-sm font-semibold text-slate-500">These preferences stay on this device and improve planning. Anonymous product learning is optional.</p></div>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Trip type" value={purpose} onChange={setPurpose} options={["vacation", "cruise_day", "business", "wedding", "visiting_family", "local_outing"]} />
        <Select label="Primary goal" value={outcome} onChange={setOutcome} options={OUTCOMES} />
        <Select label="Getting around" value={transport} onChange={setTransport} options={["taxi", "rental_car", "walking", "ferry", "mixed"]} />
        <Select label="Spending style" value={budget} onChange={setBudget} options={["free", "value", "balanced", "premium", "luxury"]} />
        <label className="flex items-start gap-3 rounded-2xl bg-[#f8f4ea] p-4 text-xs font-semibold leading-5 text-slate-600 sm:col-span-2 lg:col-span-3"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-700" /><span>Share anonymous feature-use and outcome data to improve VI Guide. No precise location, payment details, addresses, contact information, or full conversations.</span></label>
        <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.15em] text-white">{saved ? <CheckCircle2 className="h-4 w-4" /> : null}{saved ? "Saved" : "Save preferences"}</button>
      </form>
    </section>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-[#fbfaf6] px-4 text-sm font-bold normal-case tracking-normal text-[#043331]">{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}
