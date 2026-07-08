
        <a
          href="/connect/messages"
          className="mb-4 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200"
        >
          Open VI Connect Messages
        </a>
import { MessageCircle, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Car,
  Heart,
  MapPinned,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { viConnectIslandLabels } from "../../data/viConnect";
import {
  getVIConnectEngagementState,
  type VIConnectEngagementState,
} from "../../services/connect/viConnectEngagementService";
import {
  getVIConnectDatePlans,
  type VIConnectDatePlan,
} from "../../services/connect/viConnectDatePlanService";
import type { VIConnectProfile } from "../../types/viConnect";

type VIConnectPlansDrawerProps = {
  open: boolean;
  profiles: VIConnectProfile[];
  onClose: () => void;
  onOpenProfile: (profile: VIConnectProfile) => void;
};

export default function VIConnectPlansDrawer({
  open,
  profiles,
  onClose,
  onOpenProfile,
}: VIConnectPlansDrawerProps) {
  const navigate = useNavigate();

  const [engagement, setEngagement] = useState<VIConnectEngagementState>(() =>
    getVIConnectEngagementState()
  );
  const [plans, setPlans] = useState<VIConnectDatePlan[]>(() =>
    getVIConnectDatePlans()
  );

  function refresh() {
    setEngagement(getVIConnectEngagementState());
    setPlans(getVIConnectDatePlans());
  }

  useEffect(() => {
    if (!open) return;

    refresh();

    window.addEventListener("vi-connect-engagement-changed", refresh);
    window.addEventListener("vi-connect-date-plans-changed", refresh);

    return () => {
      window.removeEventListener("vi-connect-engagement-changed", refresh);
      window.removeEventListener("vi-connect-date-plans-changed", refresh);
    };
  }, [open]);

  const likedProfiles = useMemo(() => {
    const blocked = new Set(engagement.blockedProfileIds);

    return engagement.likedProfileIds
      .map((profileId) => profiles.find((profile) => profile.id === profileId))
      .filter((profile): profile is VIConnectProfile => Boolean(profile))
      .filter((profile) => !blocked.has(profile.id));
  }, [engagement.blockedProfileIds, engagement.likedProfileIds, profiles]);

  if (!open) return null;

  function openMap(island: VIConnectProfile["island"]) {
    navigate(`/map?island=${island}`);
    onClose();
  }

  function openMobility(island: VIConnectProfile["island"]) {
    navigate(`/mobility?island=${island}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[10001] bg-black/65 text-white backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close matches and plans drawer backdrop"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#071827] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#071827]/95 p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 ring-1 ring-cyan-200/15">
                <Sparkles className="h-4 w-4" />
                My VI Connect
              </div>

              <h2 className="mt-4 font-serif text-4xl leading-tight text-white">
                Matches, plans, and safety.
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 ring-1 ring-white/10 active:scale-95"
              aria-label="Close matches and plans drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            <div className="rounded-2xl bg-emerald-300/10 p-3 text-center ring-1 ring-emerald-200/10">
              <p className="text-2xl font-black text-white">
                {engagement.likedProfileIds.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100">
                Likes
              </p>
            </div>

            <div className="rounded-2xl bg-amber-300/10 p-3 text-center ring-1 ring-amber-200/10">
              <p className="text-2xl font-black text-white">{plans.length}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-100">
                Plans
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] p-3 text-center ring-1 ring-white/10">
              <p className="text-2xl font-black text-white">
                {engagement.passedProfileIds.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
                Passes
              </p>
            </div>

            <div className="rounded-2xl bg-red-300/10 p-3 text-center ring-1 ring-red-200/10">
              <p className="text-2xl font-black text-white">
                {engagement.blockedProfileIds.length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-100">
                Blocks
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5">
          <section className="rounded-[2rem] border border-emerald-200/15 bg-emerald-300/10 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                  Liked profiles
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  People you saved
                </h3>
              </div>
              <Heart className="h-6 w-6 text-emerald-100" />
            </div>

            {likedProfiles.length ? (
              <div className="grid gap-3">
                {likedProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => {
                      onOpenProfile(profile);
                      onClose();
                    }}
                    className="flex items-center gap-3 rounded-2xl bg-slate-950/50 p-3 text-left ring-1 ring-white/10 transition hover:bg-slate-900 active:scale-[0.99]"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-cyan-300/15 ring-1 ring-white/10">
                      {profile.imageUrl ? (
                        <img
                          src={profile.imageUrl}
                          alt={`${profile.displayName} profile`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sm font-black text-cyan-50">
                          {profile.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">
                        {profile.displayName}, {profile.age}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-300">
                        {viConnectIslandLabels[profile.island]} ·{" "}
                        {profile.distanceLabel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-950/50 p-4 text-sm font-semibold leading-6 text-slate-300 ring-1 ring-white/10">
                No liked profiles yet. Tap Like or open a dossier and like someone.
              </p>
            )}
          </section>

          <section className="rounded-[2rem] border border-amber-200/15 bg-amber-300/10 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                  Saved date plans
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  First plans in progress
                </h3>
              </div>
              <CalendarDays className="h-6 w-6 text-amber-100" />
            </div>

            {plans.length ? (
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <article
                    key={plan.id}
                    className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/10"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                      With {plan.profileName}
                    </p>

                    <h4 className="mt-2 text-lg font-black text-white">
                      {plan.title}
                    </h4>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      {plan.timeWindow} · {plan.placeType}
                    </p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                      {plan.inviteText}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openMap(plan.island)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white ring-1 ring-white/10 active:scale-95"
                      >
                        <MapPinned className="h-4 w-4" />
                        Map
                      </button>

                      <button
                        type="button"
                        onClick={() => openMobility(plan.island)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-3 py-3 text-xs font-black text-slate-950 active:scale-95"
                      >
                        <Car className="h-4 w-4" />
                        Ride
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-950/50 p-4 text-sm font-semibold leading-6 text-slate-300 ring-1 ring-white/10">
                No saved date plans yet. Tap Build This Date Plan from Discover.
              </p>
            )}
          </section>

          <section className="rounded-[2rem] border border-red-200/15 bg-red-300/10 p-5">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-100">
              <ShieldAlert className="h-4 w-4" />
              Safety activity
            </p>

            <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-red-50/85">
              <p>Blocked profiles: {engagement.blockedProfileIds.length}</p>
              <p>Reports submitted: {engagement.reportedProfiles.length}</p>
              <p>
                These are local MVP records now. Firebase reporting is wired when
                auth/config is active.
              </p>
            </div>
          </section>

          <div className="h-20" />
        </div>
      </aside>
    </div>
  );
}
