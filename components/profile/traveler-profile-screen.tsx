"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Cloud,
  CloudOff,
  Compass,
  RotateCcw,
  Save,
  Sparkles,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import {
  getIntelligenceMemory,
  INTELLIGENCE_MEMORY_UPDATED_EVENT,
  replaceIntelligenceMemory,
} from "@/lib/intelligence/client";
import { readJourneyPlans } from "@/lib/journey-planner";
import type {
  IntelligenceIsland,
  IntelligenceMemory,
  IntelligencePreferences,
} from "@/types/intelligence";

const ISLANDS: Array<{ value: IntelligenceIsland; label: string }> = [
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

type FormState = {
  island: IntelligenceIsland;
  adults: number;
  children: number;
  accessibilityNeeds: string;
  pace: NonNullable<IntelligencePreferences["pace"]>;
  budget: NonNullable<IntelligencePreferences["budget"]>;
  interests: string;
  food: string;
  avoid: string;
  ship: string;
  arrivalTime: string;
  allAboardTime: string;
};

export function TravelerProfileScreen() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(() => formFromMemory({}));
  const [memory, setMemory] = useState<IntelligenceMemory>({});
  const [journeyCount, setJourneyCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    function refresh(event?: Event) {
      const next =
        event instanceof CustomEvent && event.detail
          ? (event.detail as IntelligenceMemory)
          : getIntelligenceMemory();
      setMemory(next);
      setForm(formFromMemory(next));
      setJourneyCount(readJourneyPlans().length);
    }
    refresh();
    window.addEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, refresh);
  }, []);

  const rememberedCount = [
    memory.preferredIsland,
    memory.party,
    memory.preferences,
    memory.cruise,
    memory.stay,
    memory.savedPlaceIds?.length,
  ].filter(Boolean).length;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setResetArmed(false);
  }

  function save() {
    replaceIntelligenceMemory(memoryFromForm(form, memory));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function reset() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    replaceIntelligenceMemory({});
    setMemory({});
    setForm(formFromMemory({}));
    setResetArmed(false);
    setSaved(false);
  }

  const cloudBacked = Boolean(user);

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-32 text-[#043331]">
      <section className="bg-[linear-gradient(145deg,#032f2d,#075e58_62%,#0f8d83)] px-4 py-10 text-white sm:px-6 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Traveler intelligence profile
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.05em] sm:text-6xl">
                You decide what VI Guide remembers.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                These preferences ground Concierge recommendations and itinerary planning. Update them whenever the trip changes.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                {cloudBacked ? <Cloud size={20} /> : <CloudOff size={20} />}
                <div>
                  <div className="text-sm font-black">
                    {loading
                      ? "Checking account…"
                      : cloudBacked
                        ? "Synced profile"
                        : "Local profile"}
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {cloudBacked
                      ? user?.email
                      : "Sign in to carry this profile across devices"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <ProfileSection icon={Compass} eyebrow="Trip foundation" title="Where and how you travel">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField label="Preferred island" value={form.island} onChange={(value) => update("island", value as IntelligenceIsland)} options={ISLANDS} />
              <NumberField label="Adults" value={form.adults} min={1} max={20} onChange={(value) => update("adults", value)} />
              <NumberField label="Children" value={form.children} min={0} max={20} onChange={(value) => update("children", value)} />
              <SelectField label="Travel pace" value={form.pace} onChange={(value) => update("pace", value as FormState["pace"])} options={[{ value: "relaxed", label: "Relaxed" }, { value: "balanced", label: "Balanced" }, { value: "active", label: "Active" }]} />
              <SelectField label="Budget style" value={form.budget} onChange={(value) => update("budget", value as FormState["budget"])} options={[{ value: "value", label: "Value conscious" }, { value: "moderate", label: "Moderate" }, { value: "premium", label: "Premium" }]} />
              <TextField label="Accessibility needs" value={form.accessibilityNeeds} placeholder="Step-free access, limited walking…" onChange={(value) => update("accessibilityNeeds", value)} />
            </div>
          </ProfileSection>

          <ProfileSection icon={Sparkles} eyebrow="Personalization" title="What makes a trip feel right">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Interests" value={form.interests} placeholder="Beaches, history, snorkeling, music…" onChange={(value) => update("interests", value)} />
              <TextField label="Food preferences" value={form.food} placeholder="Local food, seafood, vegetarian…" onChange={(value) => update("food", value)} />
              <TextField label="Avoid" value={form.avoid} placeholder="Crowds, steep trails, long transfers…" onChange={(value) => update("avoid", value)} />
              <div className="rounded-2xl border border-slate-200 bg-[#f8f5ed] p-4">
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Remembered stay</div>
                <div className="mt-2 text-sm font-black">{memory.stay?.name ?? "No stay selected yet"}</div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Selecting an accommodation in VI Guide will connect it to future plans.</p>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection icon={Users} eyebrow="Cruise context" title="Protect the return window">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Ship" value={form.ship} placeholder="Ship name" onChange={(value) => update("ship", value)} />
              <TimeField label="Arrival time" value={form.arrivalTime} onChange={(value) => update("arrivalTime", value)} />
              <TimeField label="All-aboard time" value={form.allAboardTime} onChange={(value) => update("allAboardTime", value)} />
            </div>
          </ProfileSection>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white">
              <Save size={16} /> {saved ? "Profile saved" : "Save traveler profile"}
            </button>
            <button type="button" onClick={reset} className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-6 text-[10px] font-black uppercase tracking-[.16em] ${resetArmed ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 text-slate-600"}`}>
              <RotateCcw size={16} /> {resetArmed ? "Confirm reset" : "Reset AI memory"}
            </button>
            {resetArmed ? <span className="text-xs font-bold text-rose-700">Journeys and bookings will not be deleted.</span> : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Profile summary</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric value={rememberedCount} label="Memory areas" />
              <Metric value={journeyCount} label="Saved journeys" />
            </div>
          </div>
          <Link href="/concierge?open=true&prompt=Use%20my%20traveler%20profile%20to%20plan%20the%20best%20island%20day%20for%20me" className="group block rounded-[28px] bg-[#043331] p-6 text-white shadow-lg">
            <Sparkles className="text-[#f5c451]" />
            <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">Plan from this profile</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/65">Ask Concierge to turn these preferences into a grounded itinerary.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em] text-[#f5c451]">Open Concierge <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
          </Link>
          {!cloudBacked && !loading ? (
            <Link href="/login?next=%2Fprofile" className="block rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm font-black text-amber-900">Sign in to synchronize this profile across devices →</Link>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function ProfileSection({ icon: Icon, eyebrow, title, children }: { icon: typeof Compass; eyebrow: string; title: string; children: ReactNode }) {
  return <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6 flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f4ef] text-[#0f766e]"><Icon size={20} /></span><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">{eyebrow}</div><h2 className="mt-1 text-2xl font-black tracking-[-.035em]">{title}</h2></div></div>{children}</section>;
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-teal-600" /></label>;
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</span><input type="time" value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-teal-600" /></label>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</span><input type="number" value={value} min={min} max={max} onChange={(event) => onChange(Math.max(min, Math.min(max, Number(event.target.value) || min)))} className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-teal-600" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-teal-600">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl bg-[#f8f5ed] p-4 text-center"><div className="text-2xl font-black">{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div></div>;
}

function formFromMemory(memory: IntelligenceMemory): FormState {
  return {
    island: memory.preferredIsland ?? "stt",
    adults: memory.party?.adults ?? 1,
    children: memory.party?.children ?? 0,
    accessibilityNeeds: (memory.party?.accessibilityNeeds ?? []).join(", "),
    pace: memory.preferences?.pace ?? "balanced",
    budget: memory.preferences?.budget ?? "moderate",
    interests: (memory.preferences?.interests ?? []).join(", "),
    food: (memory.preferences?.food ?? []).join(", "),
    avoid: (memory.preferences?.avoid ?? []).join(", "),
    ship: memory.cruise?.ship ?? "",
    arrivalTime: memory.cruise?.arrivalTime ?? "",
    allAboardTime: memory.cruise?.allAboardTime ?? "",
  };
}

function memoryFromForm(form: FormState, current: IntelligenceMemory): IntelligenceMemory {
  return {
    ...current,
    preferredIsland: form.island,
    party: {
      adults: form.adults,
      children: form.children,
      accessibilityNeeds: list(form.accessibilityNeeds),
    },
    preferences: {
      interests: list(form.interests),
      pace: form.pace,
      budget: form.budget,
      food: list(form.food),
      avoid: list(form.avoid),
    },
    ...(form.ship || form.arrivalTime || form.allAboardTime
      ? {
          cruise: {
            ...current.cruise,
            ship: form.ship.trim() || undefined,
            arrivalTime: form.arrivalTime || undefined,
            allAboardTime: form.allAboardTime || undefined,
          },
        }
      : { cruise: undefined }),
  };
}

function list(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}
