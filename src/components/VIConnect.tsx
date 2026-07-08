import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Coffee,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  viConnectDateIdeas,
  viConnectEvents,
  viConnectIslandLabels,
  viConnectProfiles,
} from "../data/viConnect";
import VIConnectOnboarding from "./connect/VIConnectOnboarding";
import VIConnectPremiumHero from "./connect/VIConnectPremiumHero";
import VIConnectSwipeDeck from "./connect/VIConnectSwipeDeck";
import VIConnectMatchDossier from "./connect/VIConnectMatchDossier";
import VIConnectPlansDrawer from "./connect/VIConnectPlansDrawer";
import { getVIConnectUserProfile } from "../services/viConnectService";
import {
  getVIConnectCompatibility,
  type VIConnectCompatibility,
} from "../services/viConnectCompatibility";
import type {
  VIConnectIntent,
  VIConnectIsland,
  VIConnectProfile,
  VIConnectStatus,
  VIConnectUserProfile,
} from "../types/viConnect";

type VIConnectProps = {
  selectedIsland?: string;
  user?: unknown;
};

type TabKey = "discover" | "events" | "dateIdeas" | "safety";

const islandOptions: Array<{ value: "all" | VIConnectIsland; label: string }> = [
  { value: "all", label: "All islands" },
  { value: "st_thomas", label: "St. Thomas" },
  { value: "st_john", label: "St. John" },
  { value: "st_croix", label: "St. Croix" },
  { value: "water_island", label: "Water Island" },
];

const statusOptions: Array<{ value: "all" | VIConnectStatus; label: string }> = [
  { value: "all", label: "Everyone" },
  { value: "local", label: "Locals" },
  { value: "visitor", label: "Visitors" },
  { value: "returning_home", label: "Returning home" },
];

const intentOptions: Array<{ value: "all" | VIConnectIntent; label: string }> = [
  { value: "all", label: "Any intent" },
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious" },
  { value: "friendship", label: "Friendship" },
  { value: "events", label: "Events" },
  { value: "networking", label: "Networking" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeIsland(value?: string): "all" | VIConnectIsland {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
  ) {
    return value;
  }

  return "all";
}

function statusLabel(status: VIConnectStatus) {
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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center text-white shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
        <Users className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">
        {body}
      </p>
    </div>
  );
}

function CompatibilityBadge({
  compatibility,
}: {
  compatibility: VIConnectCompatibility;
}) {
  return (
    <div className="rounded-2xl bg-cyan-300/15 p-3 ring-1 ring-cyan-200/20">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100">
          <Star className="h-4 w-4" />
          Island Vibe
        </span>
        <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
          {compatibility.score}%
        </span>
      </div>
      <p className="mt-2 text-sm font-black text-white">{compatibility.label}</p>
    </div>
  );
}

function ProfileCard({
  profile,
  compatibility,
  liked,
  passed,
  onLike,
  onPass,
  onOpen,
}: {
  profile: VIConnectProfile;
  compatibility: VIConnectCompatibility;
  liked: boolean;
  passed: boolean;
  onLike: () => void;
  onPass: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      className={cx(
        "group overflow-hidden rounded-[2rem] border bg-slate-950/70 shadow-2xl shadow-black/25 backdrop-blur transition",
        liked
          ? "border-emerald-300/40 ring-2 ring-emerald-300/20"
          : passed
            ? "border-red-300/30 opacity-60"
            : "border-white/10 hover:border-cyan-200/40"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Open ${profile.displayName}'s VI Connect profile`}
      >
        <div className="relative min-h-48 overflow-hidden bg-gradient-to-br from-cyan-500/25 via-blue-700/25 to-amber-300/20 p-5">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-amber-200/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15 text-2xl font-black text-white shadow-xl backdrop-blur">
              {initials(profile.displayName)}
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950 shadow-lg">
                {compatibility.score}% match
              </span>

              {profile.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-200/20">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/10">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Pending
                </span>
              )}

              <span className="rounded-full bg-slate-950/50 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                {statusLabel(profile.status)}
              </span>
            </div>
          </div>

          <div className="relative mt-8">
            <h3 className="text-2xl font-black tracking-tight text-white">
              {profile.displayName}, {profile.age}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-cyan-50">
              <MapPin className="h-4 w-4" />
              {viConnectIslandLabels[profile.island]} · {profile.distanceLabel}
            </p>
          </div>
        </div>

        <div className="p-5">
          <CompatibilityBadge compatibility={compatibility} />

          <p className="mt-4 text-base font-semibold leading-6 text-white">
            {profile.headline}
          </p>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
            {profile.bio}
          </p>

          <div className="mt-4 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/10">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Why this match works
            </p>
            <ul className="mt-2 space-y-1 text-sm font-semibold leading-5 text-slate-200">
              {compatibility.reasons.slice(0, 3).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>

          {compatibility.suggestedDateIdea ? (
            <div className="mt-3 rounded-2xl bg-amber-300/10 p-3 ring-1 ring-amber-200/10">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                Suggested first meetup
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {compatibility.suggestedDateIdea.title}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-300">
                {compatibility.suggestedDateIdea.vibe}
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.intent.map((intent) => (
              <span
                key={intent}
                className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-200/10"
              >
                {intentLabel(intent)}
              </span>
            ))}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 border-t border-white/10">
        <button
          type="button"
          onClick={onPass}
          className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold text-slate-200 transition hover:bg-red-400/10 hover:text-red-100"
        >
          <X className="h-4 w-4" />
          Pass
        </button>

        <button
          type="button"
          onClick={onLike}
          className="flex items-center justify-center gap-2 border-l border-white/10 px-4 py-4 text-sm font-bold text-slate-200 transition hover:bg-emerald-400/10 hover:text-emerald-100"
        >
          <Heart className={cx("h-4 w-4", liked && "fill-current")} />
          {liked ? "Liked" : "Like"}
        </button>
      </div>
    </article>
  );
}

export default function VIConnect({ selectedIsland }: VIConnectProps) {
  const [userProfile, setUserProfile] = useState<VIConnectUserProfile | null>(() =>
    getVIConnectUserProfile()
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [islandFilter, setIslandFilter] = useState<"all" | VIConnectIsland>(
    normalizeIsland(selectedIsland)
  );
  const [statusFilter, setStatusFilter] = useState<"all" | VIConnectStatus>("all");
  const [intentFilter, setIntentFilter] = useState<"all" | VIConnectIntent>("all");
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([]);
  const [passedProfileIds, setPassedProfileIds] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<VIConnectProfile | null>(null);
  const [plansDrawerOpen, setPlansDrawerOpen] = useState(false);

  const filteredProfiles = useMemo(() => {
    return viConnectProfiles
      .filter((profile) => {
        const islandMatch = islandFilter === "all" || profile.island === islandFilter;
        const statusMatch = statusFilter === "all" || profile.status === statusFilter;
        const intentMatch = intentFilter === "all" || profile.intent.includes(intentFilter);

        return islandMatch && statusMatch && intentMatch;
      })
      .sort((a, b) => {
        const aScore = getVIConnectCompatibility(userProfile, a, viConnectDateIdeas).score;
        const bScore = getVIConnectCompatibility(userProfile, b, viConnectDateIdeas).score;
        return bScore - aScore;
      });
  }, [islandFilter, statusFilter, intentFilter, userProfile]);

  const filteredDateIdeas = useMemo(() => {
    if (islandFilter === "all") return viConnectDateIdeas;
    return viConnectDateIdeas.filter((idea) => idea.island === islandFilter);
  }, [islandFilter]);

  const filteredEvents = useMemo(() => {
    if (islandFilter === "all") return viConnectEvents;
    return viConnectEvents.filter((event) => event.island === islandFilter);
  }, [islandFilter]);

  const likedProfiles = viConnectProfiles.filter((profile) =>
    likedProfileIds.includes(profile.id)
  );

  const selectedCompatibility = selectedProfile
    ? getVIConnectCompatibility(userProfile, selectedProfile, viConnectDateIdeas)
    : null;

  function toggleLike(profileId: string) {
    setPassedProfileIds((current) => current.filter((id) => id !== profileId));
    setLikedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId]
    );
  }

  function passProfile(profileId: string) {
    setLikedProfileIds((current) => current.filter((id) => id !== profileId));
    setPassedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId]
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f0da] text-white">
      <div className="mx-auto max-w-7xl overflow-hidden bg-[#071827] shadow-2xl md:my-6 md:rounded-[2.75rem]">
        <div className="sticky top-0 z-40 flex justify-end border-b border-white/10 bg-[#071827]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            {userProfile ? "Edit VI Connect Profile" : "Create VI Connect Profile"}
          </button>
        </div>

        <VIConnectPremiumHero
          userProfile={userProfile}
          profileCount={viConnectProfiles.length}
          eventCount={viConnectEvents.length}
          likedCount={likedProfileIds.length}
          onEditProfile={() => setIsEditingProfile(true)}
        />

        <section className="hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_40%)]" />

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-100">
                  <Sparkles className="h-4 w-4" />
                  VI Guide Social Layer
                </div>

                <h1 className="max-w-3xl font-serif text-5xl leading-tight text-white sm:text-6xl lg:text-7xl">
                  VI Connect
                </h1>

                <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                  Meet better people, understand the match, and plan safer island
                  meetups through dating, friendship, events, and local discovery.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
                    Island Vibe Match
                  </span>
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
                    Suggested first meetup
                  </span>
                  <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10">
                    No exact live location
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">
                  MVP status
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-950/40 p-4 text-center">
                    <div className="text-2xl font-black">{viConnectProfiles.length}</div>
                    <div className="mt-1 text-xs text-slate-300">Profiles</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 p-4 text-center">
                    <div className="text-2xl font-black">{viConnectEvents.length}</div>
                    <div className="mt-1 text-xs text-slate-300">Events</div>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 p-4 text-center">
                    <div className="text-2xl font-black">{likedProfileIds.length}</div>
                    <div className="mt-1 text-xs text-slate-300">Likes</div>
                  </div>
                </div>

                {userProfile ? (
                  <div className="mt-4 rounded-2xl bg-cyan-400/10 p-4 ring-1 ring-cyan-200/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-cyan-100">
                          {userProfile.displayName}, {userProfile.age}
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {userProfile.headline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 active:scale-95"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <p className="text-sm font-bold text-white">Start smarter</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Create a profile so VI Connect can rank matches by your island vibe.
                    </p>
                  </div>
                )}

                {likedProfiles.length ? (
                  <div className="mt-4 rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-200/10">
                    <p className="text-sm font-bold text-emerald-100">
                      Your liked profiles
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      {likedProfiles.map((profile) => profile.displayName).join(", ")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.05] p-2">
            {[
              { key: "discover" as const, label: "Discover", icon: UserRound },
              { key: "events" as const, label: "Events", icon: CalendarDays },
              { key: "dateIdeas" as const, label: "Date Ideas", icon: Coffee },
              { key: "safety" as const, label: "Safety", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cx(
                    "inline-flex min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition",
                    activeTab === tab.key
                      ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-48 sm:px-6 lg:px-8">
          <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Island
              </span>
              <select
                value={islandFilter}
                onChange={(event) =>
                  setIslandFilter(event.target.value as "all" | VIConnectIsland)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300"
              >
                {islandOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                People
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | VIConnectStatus)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Intent
              </span>
              <select
                value={intentFilter}
                onChange={(event) =>
                  setIntentFilter(event.target.value as "all" | VIConnectIntent)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-cyan-300"
              >
                {intentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-0 pb-24 sm:px-6 lg:px-8">
          {activeTab === "discover" ? (
            filteredProfiles.length ? (
              <>
                <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => setPlansDrawerOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950/80 px-5 py-3 text-sm font-black text-white shadow-xl ring-1 ring-cyan-200/20 transition hover:bg-slate-900 active:scale-95"
          >
            My Matches & Plans
          </button>
                </div>

                <VIConnectSwipeDeck
                profiles={filteredProfiles}
                userProfile={userProfile}
                likedProfileIds={likedProfileIds}
                passedProfileIds={passedProfileIds}
                onLike={toggleLike}
                onPass={passProfile}
                onOpen={setSelectedProfile}
                />
              </>
            ) : (
              <EmptyState
                title="No profiles match those filters yet"
                body="VI Connect should support dating, friendships, networking, visitors, and events instead of only swipe dating."
              />
            )
          ) : null}

          {activeTab === "events" ? (
            filteredEvents.length ? (
              <div className="grid gap-5 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black text-white">{event.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-cyan-100">
                      {event.dateLabel} · {event.locationLabel}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {event.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No events for this island yet"
                body="Later this can pull from the real VI Guide events database and paid local business placements."
              />
            )
          ) : null}

          {activeTab === "dateIdeas" ? (
            filteredDateIdeas.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredDateIdeas.map((idea) => (
                  <article
                    key={idea.id}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-100">
                        <Coffee className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-slate-950/60 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/10">
                        {idea.estimatedCost}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-white">{idea.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-cyan-100">
                      {viConnectIslandLabels[idea.island]} · {idea.category}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {idea.description}
                    </p>
                    <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-sm text-slate-200 ring-1 ring-white/10">
                      <span className="font-bold text-white">Vibe:</span> {idea.vibe}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No date ideas found"
                body="Once connected to real app data, this can recommend restaurants, beaches, tours, mobility routes, and events."
              />
            )
          ) : null}

          {activeTab === "safety" ? (
            <div className="grid gap-5 lg:grid-cols-3">
              <article className="rounded-[2rem] border border-emerald-200/15 bg-emerald-400/10 p-6 shadow-2xl">
                <ShieldCheck className="h-9 w-9 text-emerald-100" />
                <h3 className="mt-4 text-xl font-black text-white">Privacy by default</h3>
                <p className="mt-3 text-sm leading-6 text-emerald-50/85">
                  VI Connect should never expose exact live location. Profiles should
                  show general island area only unless the user chooses otherwise.
                </p>
              </article>

              <article className="rounded-[2rem] border border-cyan-200/15 bg-cyan-400/10 p-6 shadow-2xl">
                <BadgeCheck className="h-9 w-9 text-cyan-100" />
                <h3 className="mt-4 text-xl font-black text-white">Verification layer</h3>
                <p className="mt-3 text-sm leading-6 text-cyan-50/85">
                  Add phone/email verification first, then photo verification later.
                  Keep the app 18+ and block underage profile creation.
                </p>
              </article>

              <article className="rounded-[2rem] border border-amber-200/15 bg-amber-300/10 p-6 shadow-2xl">
                <Users className="h-9 w-9 text-amber-100" />
                <h3 className="mt-4 text-xl font-black text-white">
                  Community controls
                </h3>
                <p className="mt-3 text-sm leading-6 text-amber-50/85">
                  Every profile and message needs block, report, and admin review
                  tools before public launch.
                </p>
              </article>
            </div>
          ) : null}
        </section>
      </div>

      {isEditingProfile ? (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/70 p-3 sm:p-6">
          <VIConnectOnboarding
            selectedIsland={selectedIsland}
            existingProfile={userProfile}
            onComplete={(profile) => {
              setUserProfile(profile);
              setIsEditingProfile(false);
            }}
            onCancel={() => setIsEditingProfile(false)}
          />
        </div>
      ) : null}

      {selectedProfile ? (
        <VIConnectMatchDossier
          profile={selectedProfile}
          compatibility={getVIConnectCompatibility(
            userProfile,
            selectedProfile,
            viConnectDateIdeas
          )}
          liked={likedProfileIds.includes(selectedProfile.id)}
          onLike={toggleLike}
          onClose={() => setSelectedProfile(null)}
        />
      ) : null}

      <VIConnectPlansDrawer
        open={plansDrawerOpen}
        profiles={viConnectProfiles}
        onClose={() => setPlansDrawerOpen(false)}
        onOpenProfile={(profile) => {
          setSelectedProfile(profile);
          setPlansDrawerOpen(false);
        }}
      />


    </main>
  );
}
