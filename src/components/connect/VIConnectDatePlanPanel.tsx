import { useMemo, useState } from "react";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clipboard,
  Compass,
  MapPinned,
  MessageCircle,
  Save,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { viConnectIslandLabels } from "../../data/viConnect";
import {
  buildVIConnectInviteText,
  saveVIConnectDatePlan,
} from "../../services/connect/viConnectDatePlanService";
import type { VIConnectDateIdea, VIConnectProfile } from "../../types/viConnect";

type VIConnectDatePlanPanelProps = {
  profile: VIConnectProfile;
  dateIdea?: VIConnectDateIdea;
  onClose: () => void;
};

const timeWindows = [
  "This weekend",
  "Friday evening",
  "Saturday afternoon",
  "Sunday brunch",
  "After work",
  "When we both have time",
];

const placeTypes = [
  "Public waterfront spot",
  "Coffee or smoothie place",
  "Casual restaurant",
  "Community event",
  "Beach walk",
  "Historic town walk",
];

export default function VIConnectDatePlanPanel({
  profile,
  dateIdea,
  onClose,
}: VIConnectDatePlanPanelProps) {
  const navigate = useNavigate();

  const [timeWindow, setTimeWindow] = useState(timeWindows[0]);
  const [placeType, setPlaceType] = useState(placeTypes[0]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteText = useMemo(() => {
    return buildVIConnectInviteText({
      profile,
      dateIdea,
      timeWindow,
      placeType,
      note,
    });
  }, [dateIdea, note, placeType, profile, timeWindow]);

  function openMap() {
    navigate(`/map?island=${profile.island}`);
    onClose();
  }

  function openMobility() {
    navigate(`/mobility?island=${profile.island}`);
    onClose();
  }

  function savePlan() {
    saveVIConnectDatePlan({
      profileId: profile.id,
      profileName: profile.displayName,
      island: profile.island,
      title:
        dateIdea?.title ||
        `Public meetup on ${viConnectIslandLabels[profile.island]}`,
      description:
        dateIdea?.description ||
        "Choose a public, easy-to-find location with clear timing and no pressure to extend the plan.",
      vibe: dateIdea?.vibe || "Public, relaxed, safe",
      estimatedCost: dateIdea?.estimatedCost || "$",
      timeWindow,
      placeType,
      note,
      inviteText,
    });

    setSaved(true);
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-black/70 p-3 text-white backdrop-blur-sm sm:p-6">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#071827] shadow-2xl">
        <div className="relative p-5 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.24),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(250,204,21,0.18),transparent_30%)]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/40 ring-1 ring-white/15"
            aria-label="Close date planner"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100 ring-1 ring-amber-200/15">
              <CalendarDays className="h-4 w-4" />
              Date plan draft
            </div>

            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight text-white sm:text-6xl">
              Build a safer first plan with {profile.displayName}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
              VI Connect should not just match people. It should help them make
              better, safer, public first plans.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <article className="rounded-[2rem] border border-amber-200/15 bg-amber-300/10 p-5 shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                  Suggested plan
                </p>

                <h2 className="mt-3 font-serif text-4xl leading-tight text-white">
                  {dateIdea?.title ||
                    `Public meetup on ${viConnectIslandLabels[profile.island]}`}
                </h2>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  {dateIdea?.description ||
                    "Choose a public, easy-to-find location with simple parking, clear timing, and no pressure to extend the plan."}
                </p>

                <div className="mt-4 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10">
                  <p className="text-sm font-black text-white">
                    {dateIdea?.vibe || "Public, relaxed, safe"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                    {dateIdea?.estimatedCost || "$"} · Public meetup idea
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-100/80">
                      Time window
                    </span>
                    <select
                      value={timeWindow}
                      onChange={(event) => setTimeWindow(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-black text-white outline-none"
                    >
                      {timeWindows.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-100/80">
                      Public place type
                    </span>
                    <select
                      value={placeType}
                      onChange={(event) => setPlaceType(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-black text-white outline-none"
                    >
                      {placeTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-100/80">
                      Optional note
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm font-semibold leading-6 text-white outline-none"
                      placeholder="Example: I prefer somewhere easy to park, public, and not too late."
                    />
                  </label>
                </div>
              </article>

              <article className="rounded-[2rem] border border-cyan-200/15 bg-cyan-300/10 p-5 shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                  Date command center
                </p>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={openMap}
                    className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-4 text-left ring-1 ring-white/10 active:scale-95"
                  >
                    <span>
                      <span className="block text-sm font-black text-white">
                        Open island map
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-slate-400">
                        Find a public meetup area on {viConnectIslandLabels[profile.island]}.
                      </span>
                    </span>
                    <MapPinned className="h-5 w-5 text-cyan-100" />
                  </button>

                  <button
                    type="button"
                    onClick={openMobility}
                    className="flex items-center justify-between rounded-2xl bg-slate-950/50 p-4 text-left ring-1 ring-white/10 active:scale-95"
                  >
                    <span>
                      <span className="block text-sm font-black text-white">
                        Plan ride
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-slate-400">
                        Open Mobility planner for a safer route.
                      </span>
                    </span>
                    <Car className="h-5 w-5 text-cyan-100" />
                  </button>

                  <div className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/10">
                    <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                      <MessageCircle className="h-5 w-5 text-cyan-100" />
                      Draft invite
                    </div>

                    <p className="text-sm font-semibold leading-7 text-slate-300">
                      {inviteText}
                    </p>

                    <button
                      type="button"
                      onClick={copyInvite}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
                    >
                      <Clipboard className="h-4 w-4" />
                      {copied ? "Copied" : "Copy invite text"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={savePlan}
                    className="flex items-center justify-between rounded-2xl bg-amber-300 p-4 text-left text-slate-950 active:scale-95"
                  >
                    <span>
                      <span className="block text-sm font-black">
                        {saved ? "Date plan saved" : "Save date plan"}
                      </span>
                      <span className="mt-1 block text-xs font-bold">
                        Local MVP draft saved on this device.
                      </span>
                    </span>
                    {saved ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </article>
            </div>

            <div className="mt-5 rounded-[2rem] border border-emerald-200/15 bg-emerald-300/10 p-5 text-sm font-semibold leading-7 text-emerald-50/90">
              Safety note: public first meetups, no exact live location, and
              mutual-match messaging should stay required before launch.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
