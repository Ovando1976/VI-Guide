"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, CalendarDays, CarFront, Check, MapPin, Plane, Sailboat, Sparkles, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type Island = "stt" | "stj" | "stx";
type Arrival = "airport" | "ferry" | "local";
type VehicleNeed = "auto" | "car" | "suv" | "jeep" | "van";

type RentalPlan = {
  island: Island | "";
  arrival: Arrival | "";
  pickupDate: string;
  dropoffDate: string;
  travelers: number;
  luggage: number;
  vehicleNeed: VehicleNeed;
};

const INITIAL_PLAN: RentalPlan = {
  island: "",
  arrival: "",
  pickupDate: "",
  dropoffDate: "",
  travelers: 2,
  luggage: 2,
  vehicleNeed: "auto",
};

const ISLANDS: Array<{ value: Island; label: string; detail: string }> = [
  { value: "stt", label: "St. Thomas", detail: "Airport, Charlotte Amalie, Red Hook" },
  { value: "stj", label: "St. John", detail: "Cruz Bay ferry arrival and 4x4-heavy driving" },
  { value: "stx", label: "St. Croix", detail: "Airport, Christiansted, Frederiksted" },
];

const ARRIVALS: Array<{ value: Arrival; label: string; detail: string; icon: typeof Plane }> = [
  { value: "airport", label: "Airport", detail: "Match pickup to your flight arrival", icon: Plane },
  { value: "ferry", label: "Ferry", detail: "Match pickup to the correct terminal", icon: Sailboat },
  { value: "local", label: "Already on island", detail: "Hotel, villa, town, or local pickup", icon: MapPin },
];

const VEHICLES: Array<{ value: VehicleNeed; label: string; detail: string }> = [
  { value: "auto", label: "Recommend for me", detail: "Use my group, bags, island, and arrival" },
  { value: "car", label: "Car", detail: "Best for lighter luggage and paved-route trips" },
  { value: "suv", label: "SUV", detail: "More room for luggage, hills, and group comfort" },
  { value: "jeep", label: "Jeep / 4x4", detail: "Strong fit for St. John and rougher access roads" },
  { value: "van", label: "Passenger van", detail: "Best for larger groups and lots of luggage" },
];

const STEPS = ["Island", "Arrival", "Dates", "Travelers", "Vehicle", "Match"] as const;

export function RentalDecisionLauncher() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<RentalPlan>(INITIAL_PLAN);

  const recommendation = useMemo(() => getRecommendation(plan), [plan]);
  const canContinue = getStepReady(step, plan);
  const conciergePrompt = useMemo(() => buildConciergePrompt(plan, recommendation.label), [plan, recommendation.label]);

  function next() {
    if (!canContinue) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-7 lg:px-10 lg:pt-14" aria-labelledby="rental-start-title">
      <div className="overflow-hidden rounded-[34px] border border-[#cfe0dc] bg-[#fffdf8] shadow-[0_20px_60px_rgba(3,47,45,.09)]">
        <div className="grid lg:grid-cols-[1fr_340px]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="vi-eyebrow text-[#0f766e]">Guided rental match</p>
                <h2 id="rental-start-title" className="vi-display mt-2 text-3xl font-bold sm:text-5xl">Build the right rental around your trip.</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">One decision at a time. We use your island, arrival, dates, party size, luggage, and road needs to recommend a vehicle class and narrow the operator list.</p>
              </div>
              <span className="rounded-full bg-[#e8f5f2] px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] text-[#0f766e]">Step {step + 1} of {STEPS.length}</span>
            </div>

            <div className="mt-7 grid grid-cols-6 gap-1.5" aria-label="Rental planning progress">
              {STEPS.map((label, index) => (
                <button key={label} type="button" onClick={() => index <= step && setStep(index)} className="text-left" aria-current={index === step ? "step" : undefined}>
                  <span className={`block h-1.5 rounded-full ${index <= step ? "bg-[#0f766e]" : "bg-[#dce7e4]"}`} />
                  <span className={`mt-2 hidden text-[8px] font-black uppercase tracking-[.1em] sm:block ${index === step ? "text-[#032f2d]" : "text-slate-400"}`}>{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 min-h-[315px]">
              {step === 0 && <ChoiceStep title="Which island will you drive?" subtitle="Choose the island where the rental will be picked up." options={ISLANDS.map((item) => ({ ...item, selected: plan.island === item.value, onClick: () => setPlan((p) => ({ ...p, island: item.value, arrival: item.value === "stj" && p.arrival === "airport" ? "ferry" : p.arrival })) }))} />}

              {step === 1 && (
                <div>
                  <StepTitle title="How are you arriving?" subtitle="This determines the most convenient pickup type and helps avoid bad handoffs." />
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {ARRIVALS.filter((item) => !(plan.island === "stj" && item.value === "airport")).map(({ value, label, detail, icon: Icon }) => (
                      <button key={value} type="button" onClick={() => setPlan((p) => ({ ...p, arrival: value }))} className={`rounded-[24px] border p-5 text-left transition ${plan.arrival === value ? "border-[#0f766e] bg-[#eaf8f5] shadow-[0_10px_30px_rgba(15,118,110,.10)]" : "border-[#dce7e4] bg-white hover:border-[#aad7d0]"}`}>
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#032f2d] text-[#73e3d9]"><Icon size={20} /></span>
                        <strong className="mt-4 block text-lg font-black text-[#032f2d]">{label}</strong>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <StepTitle title="When do you need the vehicle?" subtitle="Use your actual pickup and return dates so the operator handoff has enough context." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <DateField label="Pickup date" value={plan.pickupDate} onChange={(value) => setPlan((p) => ({ ...p, pickupDate: value, dropoffDate: p.dropoffDate && p.dropoffDate < value ? "" : p.dropoffDate }))} />
                    <DateField label="Return date" value={plan.dropoffDate} min={plan.pickupDate || undefined} onChange={(value) => setPlan((p) => ({ ...p, dropoffDate: value }))} />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <StepTitle title="How much space do you really need?" subtitle="Passenger count and luggage often matter more than the advertised daily rate." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Counter label="Travelers" icon={UsersRound} value={plan.travelers} min={1} max={12} onChange={(travelers) => setPlan((p) => ({ ...p, travelers }))} />
                    <Counter label="Large bags" icon={Briefcase} value={plan.luggage} min={0} max={12} onChange={(luggage) => setPlan((p) => ({ ...p, luggage }))} />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <StepTitle title="Do you already know the vehicle type?" subtitle="Choose one, or let the planner recommend the best class from your trip details." />
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {VEHICLES.map(({ value, label, detail }) => (
                      <button key={value} type="button" onClick={() => setPlan((p) => ({ ...p, vehicleNeed: value }))} className={`rounded-[22px] border p-4 text-left transition ${plan.vehicleNeed === value ? "border-[#0f766e] bg-[#eaf8f5]" : "border-[#dce7e4] bg-white hover:border-[#aad7d0]"}`}>
                        <span className="flex items-center gap-2"><CarFront size={17} className="text-[#0f766e]" /><strong className="text-sm font-black text-[#032f2d]">{label}</strong></span>
                        <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <StepTitle title="Your rental match" subtitle="This is a planning recommendation, not a live inventory promise. Confirm price, insurance, deposit, and availability with the operator." />
                  <div className="mt-6 rounded-[28px] bg-[#032f2d] p-6 text-white sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p className="vi-eyebrow text-[#f5c451]">Recommended vehicle class</p>
                        <h3 className="vi-display mt-2 text-4xl font-bold text-[#73e3d9]">{recommendation.label}</h3>
                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/68">{recommendation.reason}</p>
                      </div>
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#f5c451]"><CarFront size={27} /></span>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.11em] text-white/75">
                      <SummaryPill>{islandLabel(plan.island)}</SummaryPill><SummaryPill>{arrivalLabel(plan.arrival)}</SummaryPill><SummaryPill>{plan.travelers} traveler{plan.travelers === 1 ? "" : "s"}</SummaryPill><SummaryPill>{plan.luggage} bag{plan.luggage === 1 ? "" : "s"}</SummaryPill><SummaryPill>{rentalDays(plan.pickupDate, plan.dropoffDate)} day{rentalDays(plan.pickupDate, plan.dropoffDate) === 1 ? "" : "s"}</SummaryPill>
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Link href="#operators" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.14em] text-[#032f2d]">Compare operators <ArrowRight size={15} /></Link>
                      <Link href={`/concierge?open=true&prompt=${encodeURIComponent(conciergePrompt)}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 text-[9px] font-black uppercase tracking-[.14em] text-white"><Sparkles size={15} className="text-[#73e3d9]" /> Ask Concierge</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-[#e0e9e6] pt-6">
              <button type="button" onClick={back} disabled={step === 0} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d7e4e0] px-5 text-[9px] font-black uppercase tracking-[.12em] text-[#49615e] disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={15} /> Back</button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} disabled={!canContinue} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#032f2d] px-6 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#075e58] disabled:cursor-not-allowed disabled:bg-slate-300">Continue <ArrowRight size={15} className="text-[#f5c451]" /></button>
              ) : (
                <button type="button" onClick={() => { setPlan(INITIAL_PLAN); setStep(0); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#b8d9d3] bg-[#eaf8f5] px-6 text-[9px] font-black uppercase tracking-[.13em] text-[#0f766e]">Start over</button>
              )}
            </div>
          </div>

          <aside className="border-t border-[#d8e5e1] bg-[#f0f7f5] p-6 lg:border-l lg:border-t-0 lg:p-8">
            <p className="vi-eyebrow text-[#0f766e]">Trip summary</p>
            <h3 className="vi-display mt-2 text-2xl font-bold text-[#032f2d]">Your rental brief</h3>
            <div className="mt-6 space-y-3">
              <SummaryRow icon={MapPin} label="Island" value={plan.island ? islandLabel(plan.island) : "Not selected"} ready={Boolean(plan.island)} />
              <SummaryRow icon={Plane} label="Arrival" value={plan.arrival ? arrivalLabel(plan.arrival) : "Not selected"} ready={Boolean(plan.arrival)} />
              <SummaryRow icon={CalendarDays} label="Dates" value={plan.pickupDate && plan.dropoffDate ? `${formatDate(plan.pickupDate)} – ${formatDate(plan.dropoffDate)}` : "Add pickup + return"} ready={Boolean(plan.pickupDate && plan.dropoffDate)} />
              <SummaryRow icon={UsersRound} label="Party" value={`${plan.travelers} traveler${plan.travelers === 1 ? "" : "s"} · ${plan.luggage} bag${plan.luggage === 1 ? "" : "s"}`} ready={step >= 3} />
              <SummaryRow icon={CarFront} label="Vehicle" value={step >= 4 ? recommendation.label : "We’ll recommend one"} ready={step >= 4} />
            </div>
            <div className="mt-7 rounded-[24px] bg-white p-5 shadow-[0_10px_30px_rgba(3,47,45,.06)]">
              <div className="flex items-start gap-3"><Sparkles size={18} className="mt-0.5 shrink-0 text-[#9b5d12]" /><div><p className="text-sm font-black text-[#032f2d]">Why this flow matters</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">It prevents users from jumping straight to a daily rate before checking pickup logistics, passenger fit, luggage, ferry restrictions, and the true total cost.</p></div></div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function ChoiceStep({ title, subtitle, options }: { title: string; subtitle: string; options: Array<{ value: string; label: string; detail: string; selected: boolean; onClick: () => void }> }) {
  return <div><StepTitle title={title} subtitle={subtitle} /><div className="mt-6 grid gap-3 sm:grid-cols-3">{options.map((option) => <button key={option.value} type="button" onClick={option.onClick} className={`rounded-[24px] border p-5 text-left transition ${option.selected ? "border-[#0f766e] bg-[#eaf8f5] shadow-[0_10px_30px_rgba(15,118,110,.10)]" : "border-[#dce7e4] bg-white hover:border-[#aad7d0]"}`}><strong className="block text-lg font-black text-[#032f2d]">{option.label}</strong><span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{option.detail}</span>{option.selected && <span className="mt-4 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[.11em] text-[#0f766e]"><Check size={14} /> Selected</span>}</button>)}</div></div>;
}

function StepTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><h3 className="vi-display text-3xl font-bold text-[#032f2d] sm:text-4xl">{title}</h3><p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{subtitle}</p></div>;
}

function DateField({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (value: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  return <label className="rounded-[24px] border border-[#dce7e4] bg-white p-5"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-[.11em] text-[#49615e]"><CalendarDays size={16} className="text-[#0f766e]" /> {label}</span><input type="date" value={value} min={min || today} onChange={(event) => onChange(event.target.value)} className="mt-4 w-full rounded-2xl border border-[#cfded9] bg-[#f8fbfa] px-4 py-3 text-base font-bold text-[#032f2d] outline-none focus:border-[#0f766e]" /></label>;
}

function Counter({ label, icon: Icon, value, min, max, onChange }: { label: string; icon: typeof UsersRound; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="rounded-[24px] border border-[#dce7e4] bg-white p-5"><span className="flex items-center gap-2 text-xs font-black uppercase tracking-[.11em] text-[#49615e]"><Icon size={16} className="text-[#0f766e]" /> {label}</span><div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="grid h-12 w-12 place-items-center rounded-full border border-[#cfded9] text-2xl font-bold text-[#032f2d] disabled:opacity-30">−</button><strong className="vi-display text-5xl font-bold text-[#032f2d]">{value}</strong><button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid h-12 w-12 place-items-center rounded-full bg-[#032f2d] text-2xl font-bold text-white disabled:opacity-30">+</button></div></div>;
}

function SummaryRow({ icon: Icon, label, value, ready }: { icon: typeof MapPin; label: string; value: string; ready: boolean }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-[#d8e5e1] bg-white p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf8f5] text-[#0f766e]"><Icon size={16} /></span><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className={`mt-1 text-sm font-black ${ready ? "text-[#032f2d]" : "text-slate-400"}`}>{value}</p></div></div>;
}

function SummaryPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">{children}</span>;
}

function getStepReady(step: number, plan: RentalPlan) {
  if (step === 0) return Boolean(plan.island);
  if (step === 1) return Boolean(plan.arrival);
  if (step === 2) return Boolean(plan.pickupDate && plan.dropoffDate && plan.dropoffDate >= plan.pickupDate);
  if (step === 3) return plan.travelers >= 1 && plan.luggage >= 0;
  if (step === 4) return Boolean(plan.vehicleNeed);
  return true;
}

function getRecommendation(plan: RentalPlan) {
  if (plan.vehicleNeed !== "auto") {
    const found = VEHICLES.find((vehicle) => vehicle.value === plan.vehicleNeed)!;
    return { label: found.label, reason: `You selected ${found.label}. We’ll use your island, arrival, group, luggage, and dates to compare operators offering this class.` };
  }
  if (plan.travelers >= 7 || plan.luggage >= 7) return { label: "Passenger van", reason: "Your party or luggage load is large enough that passenger and cargo space should take priority over a smaller daily-rate vehicle." };
  if (plan.island === "stj") return { label: "Jeep / 4x4", reason: "St. John’s steep grades, tight roads, villa access, and beach-day driving often make a 4x4-oriented rental the most practical starting point." };
  if (plan.travelers >= 4 || plan.luggage >= 4) return { label: "SUV", reason: "Your group and luggage are better matched to an SUV, giving more usable space while remaining practical for island roads." };
  return { label: "Compact / midsize car", reason: "For a smaller party with lighter luggage, a regular car is likely the most efficient starting point unless your lodging or itinerary requires rough-road access." };
}

function buildConciergePrompt(plan: RentalPlan, recommendation: string) {
  return `Help me finish this USVI car rental decision. Island: ${islandLabel(plan.island)}. Arrival: ${arrivalLabel(plan.arrival)}. Pickup: ${plan.pickupDate}. Return: ${plan.dropoffDate}. Travelers: ${plan.travelers}. Large bags: ${plan.luggage}. Recommended/selected class: ${recommendation}. Compare the operators in our verified directory that fit this trip. Focus on pickup convenience, total price, deposit, insurance, additional drivers, fuel, cancellation, ferry permission if relevant, parking, and after-hours return. Do not claim live availability unless it is confirmed by the operator.`;
}

function islandLabel(island: RentalPlan["island"]) {
  return island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : island === "stx" ? "St. Croix" : "Not selected";
}

function arrivalLabel(arrival: RentalPlan["arrival"]) {
  return arrival === "airport" ? "Airport arrival" : arrival === "ferry" ? "Ferry arrival" : arrival === "local" ? "Already on island" : "Not selected";
}

function rentalDays(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}
