import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Compass,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { viConnectIslandLabels } from "../../data/viConnect";
import {
  likeVIConnectProfile,
  passVIConnectProfile,
} from "../../services/connect/viConnectEngagementService";
import type { VIConnectCompatibility } from "../../services/viConnectCompatibility";
import type { VIConnectIntent, VIConnectProfile } from "../../types/viConnect";
import VIConnectDatePlanPanel from "./VIConnectDatePlanPanel";
import VIConnectSafetyActions from "./VIConnectSafetyActions";

type VIConnectMatchDossierProps = {
  profile: VIConnectProfile;
  compatibility: VIConnectCompatibility;
  liked: boolean;
  onClose: () => void;
  onLike: (profileId: string) => void;
};

function statusLabel(status: VIConnectProfile["status"]) {
  if (status === "local") return "Local";
  if (status === "visitor") return "Visitor";
  return "Returning home";
}

function intentLabel(intent: VIConnectIntent) {
  if (intent === "dating") return "Dating";
  if (intent === "serious") return "Serious";
  if (intent === "friendship") return "Friendship";
  if (intent === "events") return "Events";
  return "Networking";
}

function scoreGradient(score: number) {
  if (score >= 90) return "from-emerald-300 via-cyan-300 to-amber-300";
  if (score >= 80) return "from-cyan-300 via-emerald-300 to-blue-300";
  if (score >= 70) return "from-cyan-300 via-blue-300 to-slate-200";
  return "from-slate-300 via-cyan-300 to-slate-500";
}

export default function VIConnectMatchDossier({
  profile,
  compatibility,
  liked,
  onClose,
  onLike,
}: VIConnectMatchDossierProps) {
  const photos = useMemo(() => {
    return Array.from(
      new Set(
        [
          profile.primaryPhotoUrl,
          profile.imageUrl,
          ...(profile.photoUrls || []),
        ].filter(Boolean) as string[]
      )
    );
  }, [profile.imageUrl, profile.photoUrls, profile.primaryPhotoUrl]);

  const [activePhoto, setActivePhoto] = useState(photos[0] || "");
  const [datePlanOpen, setDatePlanOpen] = useState(false);
  const [localLiked, setLocalLiked] = useState(liked);

  const heroPhoto = activePhoto || photos[0] || "";
  const reasons = compatibility.reasons || [];
  const interests = profile.interests || [];
  const intents = profile.intent || [];

  function likeProfile() {
    likeVIConnectProfile(profile.id);
    setLocalLiked(true);
    onLike(profile.id);
  }

  function passProfile() {
    passVIConnectProfile(profile.id);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 p-3 text-white backdrop-blur-sm sm:p-6">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.75rem] border border-white/10 bg-[#071827] shadow-2xl">
          <div className="relative min-h-[520px] overflow-hidden">
            {heroPhoto ? (
              <>
                <img
                  src={heroPhoto}
                  alt={`${profile.displayName} profile portrait`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/35" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/25" />
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.28),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(250,204,21,0.18),transparent_30%),linear-gradient(135deg,#071827,#020617)]" />
            )}

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/70"
              aria-label="Close match dossier"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 grid min-h-[520px] gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_420px] lg:items-end">
              <div className="max-w-3xl self-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  Match Dossier
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {profile.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-100 ring-1 ring-emerald-200/25">
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                      <ShieldCheck className="h-4 w-4" />
                      Verification pending
                    </span>
                  )}

                  <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-black text-white ring-1 ring-white/15 backdrop-blur">
                    {statusLabel(profile.status)}
                  </span>

                  {profile.isDemoProfile ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white ring-1 ring-white/15 backdrop-blur">
                      Demo profile
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-5 font-serif text-6xl leading-none text-white sm:text-7xl">
                  {profile.displayName}, {profile.age}
                </h1>

                <p className="mt-4 flex items-center gap-2 text-base font-black text-cyan-100">
                  <MapPin className="h-5 w-5" />
                  {viConnectIslandLabels[profile.island]} · {profile.distanceLabel}
                </p>

                <p className="mt-5 max-w-2xl text-2xl font-black leading-9 text-white">
                  {profile.headline}
                </p>

                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-200">
                  {profile.bio}
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-5">
                  <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${scoreGradient(
                        compatibility.score
                      )}`}
                    />
                    <div className="absolute inset-3 rounded-full bg-slate-950" />
                    <div className="relative text-center">
                      <div className="text-4xl font-black text-white">
                        {compatibility.score}
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                        Match
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                      Island Vibe Score
                    </p>
                    <h2 className="mt-2 font-serif text-3xl leading-tight text-white">
                      {compatibility.label}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      This explains why the connection may be worth exploring.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={likeProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/10 active:scale-95"
                  >
                    <Heart className={localLiked ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                    {localLiked ? "Liked" : "Like Profile"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDatePlanOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/10 active:scale-95"
                  >
                    <CalendarDays className="h-5 w-5" />
                    Build Date Plan
                  </button>

                  <button
                    type="button"
                    onClick={passProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
                  >
                    Pass for now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {photos.length > 1 ? (
            <div className="border-y border-white/10 bg-slate-950/50 p-4">
              <div className="flex gap-3 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => setActivePhoto(photo)}
                    className={`h-24 w-24 shrink-0 overflow-hidden rounded-2xl border ${
                      photo === heroPhoto ? "border-cyan-200" : "border-white/10"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${profile.displayName} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                    Why this match works
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Match intelligence
                  </h2>
                </div>

                <Star className="h-6 w-6 text-amber-100" />
              </div>

              <div className="grid gap-3">
                {reasons.map((reason) => (
                  <div
                    key={reason}
                    className="flex gap-3 rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/10"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    <p className="text-sm font-semibold leading-6 text-slate-200">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                  Intent
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {intents.map((intent) => (
                    <span
                      key={intent}
                      className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100 ring-1 ring-cyan-200/10"
                    >
                      {intentLabel(intent)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                  Interests
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-slate-200 ring-1 ring-white/10"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-5">
              {compatibility.suggestedDateIdea ? (
                <div className="rounded-[2rem] border border-amber-200/15 bg-amber-300/10 p-5 shadow-2xl">
                  <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                    <Compass className="h-4 w-4" />
                    Suggested first date
                  </p>

                  <h2 className="mt-4 font-serif text-4xl leading-tight text-white">
                    {compatibility.suggestedDateIdea.title}
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
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
                    onClick={() => setDatePlanOpen(true)}
                    className="mt-4 w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-amber-500/10 active:scale-95"
                  >
                    Open Date Planner
                  </button>
                </div>
              ) : null}

              <VIConnectSafetyActions
                profile={profile}
                onBlocked={onClose}
              />

              <div className="rounded-[2rem] border border-cyan-200/15 bg-cyan-300/10 p-5 shadow-2xl">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                  <MessageCircle className="h-4 w-4" />
                  Message status
                </p>

                <p className="mt-4 text-sm font-semibold leading-7 text-cyan-50/85">
                  Messaging is locked in this MVP until mutual-match logic, Firebase
                  security rules, reporting, and moderation are connected.
                </p>
              </div>
            </section>
          </div>

          <div className="h-28" />
        </section>
      </div>

      {datePlanOpen ? (
        <VIConnectDatePlanPanel
          profile={profile}
          dateIdea={compatibility.suggestedDateIdea}
          onClose={() => setDatePlanOpen(false)}
        />
      ) : null}
    </>
  );
}
