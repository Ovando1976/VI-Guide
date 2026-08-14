"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  Cloud,
  CloudOff,
  Compass,
  Crown,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { ViPublicHeader } from "@/components/brand/vi-public-header";
import {
  getIntelligenceMemory,
  INTELLIGENCE_MEMORY_UPDATED_EVENT,
  replaceIntelligenceMemory,
} from "@/lib/intelligence/client";
import { readJourneyPlans } from "@/lib/journey-planner";
import type {
  IntelligenceIsland,
  IntelligenceMemory,
  IntelligenceNotificationPreferences,
  IntelligencePreferences,
} from "@/types/intelligence";

const ISLANDS: Array<{ value: IntelligenceIsland; label: string }> = [
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

const ALERT_LEVELS: Array<{
  value: NonNullable<IntelligenceNotificationPreferences["minimumSeverity"]>;
  label: string;
}> = [
  { value: "medium", label: "Medium and above" },
  { value: "high", label: "High and critical" },
  { value: "critical", label: "Critical only" },
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
  tripMonitoring: boolean;
  inAppAlerts: boolean;
  emailAlerts: boolean;
  minimumSeverity: NonNullable<
    IntelligenceNotificationPreferences["minimumSeverity"]
  >;
  notifyOnRecovery: boolean;
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
    return () =>
      window.removeEventListener(INTELLIGENCE_MEMORY_UPDATED_EVENT, refresh);
  }, []);

  const rememberedCount = [
    memory.preferredIsland,
    memory.party,
    memory.preferences,
    memory.notifications,
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
    <main className="min-h-screen bg-[#f8f4ea] pb-32 text-[#043331]">
      <section className="px-4 pt-5 sm:px-6 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <ViPublicHeader
            actionHref="/concierge?open=true&prompt=Use%20my%20traveler%20profile%20to%20plan%20the%20best%20island%20day%20for%20me"
            actionLabel="Plan from my profile"
            actionIcon={Sparkles}
            secondaryHref="/plus"
            secondaryLabel="Traveler Plus"
          />

          <section className="relative isolate mt-5 min-h-[34rem] overflow-hidden rounded-[34px] border border-white/20 bg-[#043331] text-white shadow-[0_32px_90px_rgba(4,51,49,.22)] sm:min-h-[38rem] lg:rounded-[42px]">
            <Image
              src="/images/usvi-harbor-hero.jpg"
              alt="Charlotte Amalie harbor and the hills of St. Thomas"
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="-z-30 object-cover"
            />
            <span className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,38,37,.96)_0%,rgba(2,38,37,.78)_45%,rgba(2,38,37,.2)_100%)]" />
            <span className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(2,38,37,.9)_0%,rgba(2,38,37,.18)_58%,transparent_86%)]" />

            <div className="grid min-h-[34rem] gap-7 p-5 sm:min-h-[38rem] sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:p-10">
              <div className="self-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/35 bg-[#032f2d]/55 px-4 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f8d77c] backdrop-blur-md">
                  <ShieldCheck size={14} /> Traveler intelligence profile
                </div>
                <h1 className="vi-display mt-5 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-6xl lg:text-7xl">
                  You decide what USVI Explorer remembers.
                </h1>
                <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base sm:leading-8">
                  Your profile is the memory and preference layer behind Concierge,
                  itinerary planning, trip protection, and smarter island decisions.
                  Change it whenever your priorities or trip context changes.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <HeroPill label={`${rememberedCount} memory areas`} />
                  <HeroPill label={`${journeyCount} saved ${journeyCount === 1 ? "journey" : "journeys"}`} />
                  <HeroPill label={form.tripMonitoring ? "Trip monitoring on" : "Trip monitoring off"} />
                </div>
              </div>

              <div className="self-end rounded-[28px] border border-white/16 bg-[#032f2d]/78 p-5 shadow-[0_22px_65px_rgba(2,31,29,.24)] backdrop-blur-xl sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#7ce0d4]/14 text-[#8ef0e7] ring-1 ring-white/10">
                    {cloudBacked ? <Cloud size={22} /> : <CloudOff size={22} />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                      Memory continuity
                    </div>
                    <div className="mt-1 text-xl font-black">
                      {loading
                        ? "Checking account…"
                        : cloudBacked
                          ? "Synced across devices"
                          : "Stored on this device"}
                    </div>
                    <div className="mt-2 break-all text-xs font-semibold leading-5 text-white/60">
                      {cloudBacked
                        ? user?.email
                        : "Sign in to carry this profile and its travel context between devices."}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/12 pt-5">
                  <HeroMetric value={rememberedCount} label="Memory areas" />
                  <HeroMetric value={journeyCount} label="Journeys" />
                </div>

                {!cloudBacked && !loading ? (
                  <Link
                    href="/login?next=%2Fprofile"
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:bg-[#ffdc76]"
                  >
                    Sign in to synchronize <ArrowRight size={14} />
                  </Link>
                ) : (
                  <div className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-3 text-xs font-semibold leading-5 text-white/62">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8ef0e7]" />
                    You control what is remembered and can reset AI memory without deleting journeys or bookings.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <ContinuityCard
              icon={Sparkles}
              title="Concierge aware"
              text="Preferences become context for recommendations and complete island plans."
            />
            <ContinuityCard
              icon={Compass}
              title="Trip connected"
              text="Party, pace, budget, interests, and stays remain available to planning tools."
            />
            <ContinuityCard
              icon={BellRing}
              title="Protection controlled"
              text="You choose whether saved journeys are monitored and how material alerts reach you."
            />
          </div>

          <ProfileSection
            icon={Compass}
            eyebrow="Trip foundation"
            title="Where and how you travel"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Preferred island"
                value={form.island}
                onChange={(value) =>
                  update("island", value as IntelligenceIsland)
                }
                options={ISLANDS}
              />
              <NumberField
                label="Adults"
                value={form.adults}
                min={1}
                max={20}
                onChange={(value) => update("adults", value)}
              />
              <NumberField
                label="Children"
                value={form.children}
                min={0}
                max={20}
                onChange={(value) => update("children", value)}
              />
              <SelectField
                label="Travel pace"
                value={form.pace}
                onChange={(value) =>
                  update("pace", value as FormState["pace"])
                }
                options={[
                  { value: "relaxed", label: "Relaxed" },
                  { value: "balanced", label: "Balanced" },
                  { value: "active", label: "Active" },
                ]}
              />
              <SelectField
                label="Budget style"
                value={form.budget}
                onChange={(value) =>
                  update("budget", value as FormState["budget"])
                }
                options={[
                  { value: "value", label: "Value conscious" },
                  { value: "moderate", label: "Moderate" },
                  { value: "premium", label: "Premium" },
                ]}
              />
              <TextField
                label="Accessibility needs"
                value={form.accessibilityNeeds}
                placeholder="Step-free access, limited walking…"
                onChange={(value) => update("accessibilityNeeds", value)}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            icon={Sparkles}
            eyebrow="Personalization"
            title="What makes a trip feel right"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Interests"
                value={form.interests}
                placeholder="Beaches, history, snorkeling, music…"
                onChange={(value) => update("interests", value)}
              />
              <TextField
                label="Food preferences"
                value={form.food}
                placeholder="Local food, seafood, vegetarian…"
                onChange={(value) => update("food", value)}
              />
              <TextField
                label="Avoid"
                value={form.avoid}
                placeholder="Crowds, steep trails, long transfers…"
                onChange={(value) => update("avoid", value)}
              />
              <div className="rounded-2xl border border-[#dbe8e4] bg-[#f8f5ed] p-4">
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-[#78908c]">
                  Remembered stay
                </div>
                <div className="mt-2 text-sm font-black">
                  {memory.stay?.name ?? "No stay selected yet"}
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#667b77]">
                  Selecting an accommodation in USVI Explorer will connect it to
                  future plans.
                </p>
              </div>
            </div>
          </ProfileSection>

          <ProfileSection
            icon={Users}
            eyebrow="Cruise context"
            title="Protect the return window"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField
                label="Ship"
                value={form.ship}
                placeholder="Ship name"
                onChange={(value) => update("ship", value)}
              />
              <TimeField
                label="Arrival time"
                value={form.arrivalTime}
                onChange={(value) => update("arrivalTime", value)}
              />
              <TimeField
                label="All-aboard time"
                value={form.allAboardTime}
                onChange={(value) => update("allAboardTime", value)}
              />
            </div>
          </ProfileSection>

          <ProfileSection
            icon={BellRing}
            eyebrow="Proactive protection"
            title="Choose when USVI Explorer should alert you"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleField
                label="Monitor saved journeys"
                description="Recheck upcoming trips for timing, transfer, booking, accessibility, weather, and return-to-ship changes."
                checked={form.tripMonitoring}
                onChange={(checked) => update("tripMonitoring", checked)}
              />
              <ToggleField
                label="In-app alerts"
                description="Place material changes in your private USVI Explorer notification center."
                checked={form.inAppAlerts}
                onChange={(checked) => update("inAppAlerts", checked)}
              />
              <ToggleField
                label="Email alerts"
                description={
                  cloudBacked
                    ? `Send opted-in alerts to ${user?.email ?? "your account email"}.`
                    : "Sign in before email alerts can be delivered."
                }
                checked={form.emailAlerts}
                disabled={!cloudBacked}
                onChange={(checked) => update("emailAlerts", checked)}
              />
              <ToggleField
                label="Tell me when risk clears"
                description="Send one recovery update after a previously material trip risk is resolved."
                checked={form.notifyOnRecovery}
                onChange={(checked) => update("notifyOnRecovery", checked)}
              />
              <SelectField
                label="Minimum alert severity"
                value={form.minimumSeverity}
                onChange={(value) =>
                  update(
                    "minimumSeverity",
                    value as FormState["minimumSeverity"],
                  )
                }
                options={ALERT_LEVELS}
              />
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950/70">
                USVI Explorer only alerts when the material risk fingerprint changes.
                Repeated checks of the same condition are deduplicated, and
                non-escalating changes observe a cooldown.
              </div>
            </div>
          </ProfileSection>

          <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-[#d9e6e2] bg-[#fffdf8] p-4 shadow-[0_14px_38px_rgba(4,51,49,.06)] sm:p-5">
            <button
              type="button"
              onClick={save}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:bg-[#075e58]"
            >
              <Save size={16} /> {saved ? "Profile saved" : "Save traveler profile"}
            </button>
            <button
              type="button"
              onClick={reset}
              className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-6 text-[10px] font-black uppercase tracking-[.16em] transition ${
                resetArmed
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-[#ceddd9] bg-white text-[#566d69] hover:border-[#9fcfc7]"
              }`}
            >
              <RotateCcw size={16} />
              {resetArmed ? "Confirm reset" : "Reset AI memory"}
            </button>
            {resetArmed ? (
              <span className="text-xs font-bold text-rose-700">
                Journeys and bookings will not be deleted.
              </span>
            ) : (
              <span aria-live="polite" className="text-xs font-semibold text-[#718480]">
                {saved ? "Your updated profile is now available to USVI Explorer." : "Save after changing your travel preferences or alert settings."}
              </span>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[28px] border border-[#d9e6e2] bg-[#fffdf8] p-6 shadow-[0_16px_45px_rgba(4,51,49,.07)]">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#b16a18]">
              Profile summary
            </div>
            <h2 className="vi-display mt-2 text-2xl font-black tracking-[-.04em]">
              Your travel context at a glance.
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric value={rememberedCount} label="Memory areas" />
              <Metric value={journeyCount} label="Saved journeys" />
            </div>
            <div className="mt-4 rounded-2xl border border-[#dce8e4] bg-white p-4 text-xs font-semibold leading-5 text-[#607571]">
              <span className="font-black text-[#043331]">Preferred island:</span>{" "}
              {ISLANDS.find((island) => island.value === form.island)?.label ?? "St. Thomas"}
              <br />
              <span className="font-black text-[#043331]">Travel style:</span>{" "}
              {form.pace} · {form.budget}
            </div>
          </div>

          <Link
            href="/concierge?open=true&prompt=Use%20my%20traveler%20profile%20to%20plan%20the%20best%20island%20day%20for%20me"
            className="group relative isolate block min-h-[320px] overflow-hidden rounded-[30px] border border-white/20 bg-[#043331] p-6 text-white shadow-[0_20px_55px_rgba(4,51,49,.18)]"
          >
            <Image
              src="/images/beaches/st-thomas/magens-bay-1.jpg"
              alt="Magens Bay in St. Thomas"
              fill
              sizes="320px"
              className="-z-30 object-cover transition duration-700 group-hover:scale-105"
            />
            <span className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(2,38,37,.12)_0%,rgba(2,38,37,.92)_78%,rgba(2,38,37,.98)_100%)]" />
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/12 text-[#f5c451] backdrop-blur-md">
              <Sparkles size={20} />
            </span>
            <div className="absolute inset-x-6 bottom-6">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#8ef0e7]">
                Profile → Concierge
              </div>
              <h2 className="vi-display mt-2 text-3xl font-black leading-[.96] tracking-[-.045em]">
                Turn this profile into an island day.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/68">
                Ask Concierge to use your saved pace, party, interests, budget, and travel constraints as the starting point.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#f5c451]">
                Open Concierge
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <Link
            href="/plus"
            className="block rounded-[26px] border border-[#ead89e] bg-[#fff7df] p-5 transition hover:-translate-y-0.5 hover:border-[#dfc56e]"
          >
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#9a6815]">
              <Crown size={15} /> Traveler Plus
            </div>
            <p className="mt-2 text-sm font-black leading-6 text-[#5f4818]">
              Keep premium Concierge, trip intelligence, and account tools connected to this traveler profile.
            </p>
          </Link>
        </aside>
      </section>
    </main>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-[#032f2d]/52 px-3 py-2 text-[8px] font-black uppercase tracking-[.13em] text-white/78 backdrop-blur-md">
      {label}
    </span>
  );
}

function HeroMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3 text-center">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/46">
        {label}
      </div>
    </div>
  );
}

function ContinuityCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#d9e6e2] bg-[#fffdf8] p-4 shadow-[0_12px_32px_rgba(4,51,49,.05)]">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f4ef] text-[#0f766e]">
        <Icon size={17} />
      </span>
      <div className="mt-3 text-sm font-black">{title}</div>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#6a7d79]">{text}</p>
    </div>
  );
}

function ProfileSection({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof Compass;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] p-5 shadow-[0_16px_45px_rgba(4,51,49,.06)] sm:p-7">
      <div className="mb-6 flex items-center gap-4 border-b border-[#e3ece9] pb-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f4ef] text-[#0f766e]">
          <Icon size={20} />
        </span>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#b16a18]">
            {eyebrow}
          </div>
          <h2 className="vi-display mt-1 text-2xl font-black tracking-[-.035em]">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-[.16em] text-[#78908c]">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-[#a9b6b3] focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
      />
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-[.16em] text-[#78908c]">
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-[.16em] text-[#78908c]">
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(
            Math.max(min, Math.min(max, Number(event.target.value) || min)),
          )
        }
        className="h-12 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[9px] font-black uppercase tracking-[.16em] text-[#78908c]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#d8e4e1] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
        disabled
          ? "cursor-not-allowed border-[#dde6e4] bg-[#f5f7f6] opacity-60"
          : "cursor-pointer border-[#d8e4e1] bg-white hover:border-[#a9d4cd] hover:bg-[#fbfdfc]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-teal-700"
      />
      <span>
        <span className="block text-sm font-black text-[#043331]">{label}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-[#6a7d79]">
          {description}
        </span>
      </span>
    </label>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-[#f8f5ed] p-4 text-center">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-[#879995]">
        {label}
      </div>
    </div>
  );
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
    tripMonitoring: memory.notifications?.tripMonitoring !== false,
    inAppAlerts: memory.notifications?.inApp !== false,
    emailAlerts: memory.notifications?.email === true,
    minimumSeverity: memory.notifications?.minimumSeverity ?? "high",
    notifyOnRecovery: memory.notifications?.notifyOnRecovery !== false,
  };
}

function memoryFromForm(
  form: FormState,
  current: IntelligenceMemory,
): IntelligenceMemory {
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
    notifications: {
      tripMonitoring: form.tripMonitoring,
      inApp: form.inAppAlerts,
      email: form.emailAlerts,
      minimumSeverity: form.minimumSeverity,
      notifyOnRecovery: form.notifyOnRecovery,
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
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}
