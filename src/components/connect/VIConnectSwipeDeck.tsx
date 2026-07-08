import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Compass,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { viConnectDateIdeas, viConnectIslandLabels } from "../../data/viConnect";
import {
  getVIConnectCompatibility,
  type VIConnectCompatibility,
} from "../../services/viConnectCompatibility";
import type {
  VIConnectProfile,
  VIConnectUserProfile,
} from "../../types/viConnect";
import VIConnectDatePlanPanel from "./VIConnectDatePlanPanel";

type VIConnectSwipeDeckProps = {
  profiles: VIConnectProfile[];
  userProfile: VIConnectUserProfile | null;
  likedProfileIds: string[];
  passedProfileIds: string[];
  onLike: (profileId: string) => void;
  onPass: (profileId: string) => void;
  onOpen: (profile: VIConnectProfile) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status: VIConnectProfile["status"]) {
  if (status === "local") return "Local";
  if (status === "visitor") return "Visitor";
  return "Returning home";
}

function scoreTone(score: number) {
  if (score >= 90) return "from-emerald-300 via-cyan-300 to-amber-300";
  if (score >= 80) return "from-cyan-300 via-emerald-300 to-blue-300";
  if (score >= 70) return "from-cyan-300 via-blue-300 to-slate-200";
  return "from-slate-300 via-cyan-300 to-slate-500";
}

function MatchScore({ compatibility }: { compatibility: VIConnectCompatibility }) {
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${scoreTone(
          compatibility.score
        )} opacity-90`}
      />
      <div className="absolute inset-3 rounded-full bg-slate-950" />
      <div className="relative text-center">
        <div className="text-4xl font-black text-white">{compatibility.score}</div>
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
          Match
        </div>
      </div>
    </div>
  );
}

function MatchReasons({
  compatibility,
}: {
  compatibility: VIConnectCompatibility;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white/[0.07] p-4 ring-1 ring-white/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/80">
        Why this works
      </p>

      <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-200">
        {compatibility.reasons.slice(0, 5).map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VIConnectSwipeDeck({
  profiles,
  userProfile,
  likedProfileIds,
  passedProfileIds,
  onLike,
  onPass,
  onOpen,
}: VIConnectSwipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastAction, setLastAction] = useState<"like" | "pass" | null>(null);
  const [datePlannerOpen, setDatePlannerOpen] = useState(false);

  useEffect(() => {
    if (activeIndex >= profiles.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, profiles.length]);

  const activeProfile = profiles[activeIndex];

  const compatibility = useMemo(() => {
    if (!activeProfile) return null;
    return getVIConnectCompatibility(userProfile, activeProfile, viConnectDateIdeas);
  }, [activeProfile, userProfile]);

  const upcomingProfiles = useMemo(() => {
    if (!activeProfile) return [];

    return profiles
      .filter((profile) => profile.id !== activeProfile.id)
      .slice(0, 4);
  }, [profiles, activeProfile]);

  if (!activeProfile || !compatibility) return null;

  const liked = likedProfileIds.includes(activeProfile.id);
  const passed = passedProfileIds.includes(activeProfile.id);

  function goNext() {
    setDatePlannerOpen(false);

    if (profiles.length <= 1) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => (current + 1) % profiles.length);
  }

  function likeActiveProfile() {
    const profileId = activeProfile.id;
    setLastAction("like");

    window.setTimeout(() => {
      onLike(profileId);
      goNext();
      setLastAction(null);
    }, 320);
  }

  function passActiveProfile() {
    const profileId = activeProfile.id;
    setLastAction("pass");

    window.setTimeout(() => {
      onPass(profileId);
      goNext();
      setLastAction(null);
    }, 320);
  }

  return (
    <section
      id="vi-connect-discover"
      className="-mt-36 grid gap-5 2xl:-mt-24 2xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <article className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-slate-950 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.24),transparent_34%),radial-gradient(circle_at_88%_12%,rgba(250,204,21,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(37,99,235,0.22),transparent_38%)]" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />

        <div className="relative p-4 sm:p-5 xl:p-7">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 ring-1 ring-cyan-200/10">
                <Sparkles className="h-4 w-4" />
                Discover Command Deck
              </p>

              <h2 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">
                Smart matches, not blind swipes.
              </h2>
            </div>

            <div
              className={`inline-flex w-fit rounded-full bg-gradient-to-r ${scoreTone(
                compatibility.score
              )} p-[2px] shadow-xl`}
            >
              <div className="rounded-full bg-slate-950 px-4 py-2">
                <span className="text-sm font-black text-white">
                  {compatibility.score}% Island Vibe Match
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.75fr)_minmax(0,1fr)]">
            <div
              onClick={() => onOpen(activeProfile)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(activeProfile);
                }
              }}
              tabIndex={0}
              className="cursor-pointer overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur transition hover:border-cyan-200/30 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
              aria-label={`Open ${activeProfile.displayName} match dossier`}
            >
              <div className="relative min-h-[260px] bg-gradient-to-br from-cyan-500/20 via-blue-700/20 to-amber-300/15 p-5">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute -bottom-20 left-4 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />

                <div className="relative flex items-start justify-between gap-4">
                                    <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDatePlannerOpen(true);
                    }}
                    className="group relative h-24 w-24 overflow-hidden rounded-[2rem] border border-white/20 bg-white/15 shadow-2xl ring-1 ring-white/10 transition active:scale-95"
                    aria-label={`Open ${activeProfile.displayName} match dossier`}
                  >
                    {activeProfile.imageUrl ? (
                      <img
                        src={activeProfile.imageUrl}
                        alt={`${activeProfile.displayName} demo profile portrait`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-4xl font-black text-white">
                        {initials(activeProfile.displayName)}
                      </div>
                    )}

                    <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                      Intel
                    </span>
                  </button>

                  <div className="flex flex-col items-end gap-2">
                    {activeProfile.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-emerald-200/20">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-100 ring-1 ring-white/10">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    )}

                    <span className="rounded-full bg-slate-950/60 px-3 py-1 text-xs font-black text-white ring-1 ring-white/10">
                      {statusLabel(activeProfile.status)}
                    </span>

                    {activeProfile.isDemoProfile ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/10">
                        Demo
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="relative mt-10">
                  <h3 className="font-serif text-5xl leading-none text-white sm:text-6xl">
                    {activeProfile.displayName}, {activeProfile.age}
                  </h3>

                  <p className="mt-4 flex items-center gap-2 text-base font-bold text-cyan-100">
                    <MapPin className="h-5 w-5" />
                    {viConnectIslandLabels[activeProfile.island]} ·{" "}
                    {activeProfile.distanceLabel}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-2xl font-black leading-8 text-white">
                  {activeProfile.headline}
                </p>

                <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                  {activeProfile.bio}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {activeProfile.intent.map((intent) => (
                    <span
                      key={intent}
                      className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100 ring-1 ring-cyan-200/10"
                    >
                      {intent}
                    </span>
                  ))}
                </div>

                <div
                  className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={passActiveProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-4 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
                  >
                    <X className="h-5 w-5" />
                    Pass
                  </button>

                  <button
                    type="button"
                    onClick={() => setDatePlannerOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 py-4 text-sm font-black text-slate-950 active:scale-95"
                  >
                    <Info className="h-5 w-5" />
                    Intel
                  </button>

                  <button
                    type="button"
                    onClick={likeActiveProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-3 py-4 text-sm font-black text-slate-950 active:scale-95"
                  >
                    <Heart className={liked ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                    Like
                  </button>
                </div>

                {passed ? (
                  <p className="mt-3 rounded-2xl bg-red-400/10 px-4 py-3 text-center text-sm font-bold text-red-100 ring-1 ring-red-200/10">
                    Passed. Tap Like to reverse if you change your mind.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5">
              <div
                onClick={() => onOpen(activeProfile)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(activeProfile);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur transition hover:border-cyan-200/30 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-cyan-200/50"
                aria-label={`Open ${activeProfile.displayName} match intelligence`}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <MatchScore compatibility={compatibility} />

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                      Match Intelligence
                    </p>
                    <h3 className="mt-3 font-serif text-3xl leading-tight text-white">
                      {compatibility.label}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      VI Connect explains why a match works before pushing users into messages.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <MatchReasons compatibility={compatibility} />
                </div>
              </div>

              {compatibility.suggestedDateIdea ? (
                <div
                  onClick={() => onOpen(activeProfile)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(activeProfile);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer rounded-[2rem] border border-amber-200/15 bg-amber-300/10 p-5 shadow-2xl transition hover:border-amber-100/40 hover:bg-amber-300/15 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
                  aria-label={`Open ${activeProfile.displayName} suggested first plan`}
                >
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                    <Compass className="h-4 w-4" />
                    Suggested first plan
                  </p>

                  <h3 className="mt-4 font-serif text-3xl leading-tight text-white">
                    {compatibility.suggestedDateIdea.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                    {compatibility.suggestedDateIdea.description}
                  </p>

                  <div className="mt-4 rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/10">
                    <p className="text-sm font-black text-white">
                      {compatibility.suggestedDateIdea.vibe}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-100">
                      {compatibility.suggestedDateIdea.estimatedCost} · Public meetup idea
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDatePlannerOpen(true);
                    }}
                    className="mt-4 w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/10 active:scale-95"
                  >
                    Build This Date Plan
                  </button>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[2rem] border border-emerald-200/15 bg-emerald-300/10 p-5">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-5 w-5 text-emerald-100" />
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Mutual match messaging
                      </h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50/80">
                        Message unlocks only after both people match.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-cyan-200/15 bg-cyan-300/10 p-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-cyan-100" />
                    <div>
                      <h3 className="text-sm font-black text-white">
                        Events-first dating
                      </h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-cyan-50/80">
                        Meet through mixers, walks, date nights, and public plans.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <aside className="grid gap-4 2xl:content-start">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Up next
          </p>

          <div className="mt-4 grid gap-3">
            {upcomingProfiles.map((profile, index) => {
              const nextCompatibility = getVIConnectCompatibility(
                userProfile,
                profile,
                viConnectDateIdeas
              );

              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      Math.max(
                        0,
                        profiles.findIndex((item) => item.id === profile.id)
                      )
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl bg-slate-950/50 p-3 text-left ring-1 ring-white/10 transition hover:bg-slate-900"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-cyan-300/15 ring-1 ring-white/10">
                    {profile.imageUrl ? (
                      <img
                        src={profile.imageUrl}
                        alt={`${profile.displayName} demo profile thumbnail`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-50">
                        {initials(profile.displayName)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {index + 1}. {profile.displayName}, {profile.age}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-300">
                      {nextCompatibility.score}% · {nextCompatibility.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-200/15 bg-cyan-300/10 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            Why it feels different
          </p>

          <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-200">
            <p>• Match reasons are visible before liking.</p>
            <p>• First-date ideas are built into discovery.</p>
            <p>• Location is island-aware, not exact-location creepy.</p>
            <p>• Events and public meetups are part of the dating flow.</p>
          </div>
        </div>
      </aside>
      <div data-vi-connect-dock-spacer="true" className="h-28" />

      {datePlannerOpen ? (
        <VIConnectDatePlanPanel
          profile={activeProfile}
          dateIdea={compatibility.suggestedDateIdea}
          onClose={() => setDatePlannerOpen(false)}
        />
      ) : null}
    </section>
  );
}
