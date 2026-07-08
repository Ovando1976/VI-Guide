import {
  BadgeCheck,
  CalendarDays,
  Compass,
  HeartHandshake,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  WandSparkles,
} from "lucide-react";

import type { VIConnectUserProfile } from "../../types/viConnect";

type VIConnectPremiumHeroProps = {
  userProfile: VIConnectUserProfile | null;
  profileCount: number;
  eventCount: number;
  likedCount: number;
  onEditProfile: () => void;
};

function profileReadiness(profile: VIConnectUserProfile | null) {
  if (!profile) return 18;

  let score = 0;
  if (profile.displayName) score += 12;
  if (profile.age >= 18) score += 12;
  if (profile.headline) score += 14;
  if (profile.bio && profile.bio.length >= 20) score += 18;
  if (profile.interests?.length >= 3) score += 16;
  if (profile.intent?.length) score += 12;
  if (profile.favoriteSpot) score += 8;
  if (profile.lookingFor?.length) score += 8;

  return Math.min(score, 100);
}

export default function VIConnectPremiumHero({
  userProfile,
  profileCount,
  eventCount,
  likedCount,
  onEditProfile,
}: VIConnectPremiumHeroProps) {
  const readiness = profileReadiness(userProfile);

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[#061724]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.30),transparent_32%),radial-gradient(circle_at_90%_15%,rgba(250,204,21,0.22),transparent_28%),radial-gradient(circle_at_60%_100%,rgba(59,130,246,0.28),transparent_36%)]" />
      <div className="absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-2xl shadow-cyan-950/40">
              <WandSparkles className="h-4 w-4" />
              VI Connect Intelligence
            </div>

            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              Meet better people the island way.
            </h1>

            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-200 md:text-lg">
              A smarter social dating layer for the U.S. Virgin Islands — built around
              compatibility, safety, events, date ideas, ferry-aware plans, and real island context.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95"
              >
                {userProfile ? "Upgrade My Profile" : "Create My Profile"}
                <Sparkles className="h-5 w-5" />
              </button>

              <a
                href="#vi-connect-discover"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
              >
                See Island Matches
                <Users className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Star,
                  title: "Island Vibe Match",
                  text: "Compatibility with reasons, not blind swiping.",
                },
                {
                  icon: ShieldCheck,
                  title: "Safety-first",
                  text: "No exact live location. Public meetup thinking.",
                },
                {
                  icon: CalendarDays,
                  title: "Events-first dating",
                  text: "Meet through mixers, beach walks, and date nights.",
                },
                {
                  icon: Compass,
                  title: "Date planner",
                  text: "Turn matches into real island experiences.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-100">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[3rem] bg-cyan-300/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.08] p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[2.25rem] border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
                      Match Command Center
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-white">
                      {userProfile
                        ? `${userProfile.displayName}'s island profile`
                        : "Build your island profile"}
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-cyan-300 px-4 py-3 text-center text-slate-950">
                    <div className="text-2xl font-black">{readiness}%</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                      Ready
                    </div>
                  </div>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300"
                    style={{ width: `${readiness}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/[0.07] p-4 text-center ring-1 ring-white/10">
                    <div className="text-2xl font-black text-white">{profileCount}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-300">Profiles</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.07] p-4 text-center ring-1 ring-white/10">
                    <div className="text-2xl font-black text-white">{eventCount}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-300">Events</div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.07] p-4 text-center ring-1 ring-white/10">
                    <div className="text-2xl font-black text-white">{likedCount}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-300">Likes</div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-gradient-to-br from-cyan-300/15 via-blue-500/10 to-amber-300/10">
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-2xl font-black text-white">
                        VI
                      </div>

                      <span className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950">
                        92% island match
                      </span>
                    </div>

                    <h3 className="mt-6 text-2xl font-black text-white">
                      Suggested connection
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                      Shared interests, safe public meetup, same-island plan, and event-aware date idea.
                    </p>

                    <div className="mt-5 grid gap-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                        <HeartHandshake className="h-5 w-5 text-cyan-100" />
                        <span className="text-sm font-bold text-white">
                          Shared vibe: real conversation + local food
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                        <MapPin className="h-5 w-5 text-amber-100" />
                        <span className="text-sm font-bold text-white">
                          First meetup: public waterfront coffee
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                        <MessageCircle className="h-5 w-5 text-emerald-100" />
                        <span className="text-sm font-bold text-white">
                          Message unlocks after mutual match
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[2rem] border border-emerald-200/15 bg-emerald-300/10 p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-100" />
                    <p className="text-sm font-semibold leading-6 text-emerald-50">
                      This is how VI Connect beats swipe apps: every match explains why it works
                      and suggests a safer first plan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
