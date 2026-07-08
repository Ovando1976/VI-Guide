import { useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2, Save, ShieldCheck, UserPlus } from "lucide-react";

import VIConnectPhotoManager from "./VIConnectPhotoManager";
import { saveVIConnectUserProfile } from "../../services/viConnectService";
import type {
  VIConnectIntent,
  VIConnectIsland,
  VIConnectStatus,
  VIConnectUserProfile,
} from "../../types/viConnect";

type VIConnectOnboardingProps = {
  selectedIsland?: string;
  existingProfile?: VIConnectUserProfile | null;
  onComplete: (profile: VIConnectUserProfile) => void;
  onCancel?: () => void;
};

const islandOptions: Array<{ value: VIConnectIsland; label: string }> = [
  { value: "st_thomas", label: "St. Thomas" },
  { value: "st_john", label: "St. John" },
  { value: "st_croix", label: "St. Croix" },
  { value: "water_island", label: "Water Island" },
];

const statusOptions: Array<{ value: VIConnectStatus; label: string }> = [
  { value: "local", label: "I live in the VI" },
  { value: "visitor", label: "I am visiting" },
  { value: "returning_home", label: "Returning home" },
];

const intentOptions: Array<{ value: VIConnectIntent; label: string }> = [
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious" },
  { value: "friendship", label: "Friendship" },
  { value: "events", label: "Events" },
  { value: "networking", label: "Networking" },
];

const interestOptions = [
  "beach days",
  "live music",
  "local food",
  "coffee",
  "fitness",
  "faith",
  "business",
  "boating",
  "history",
  "quiet dates",
  "restaurants",
  "community",
  "hiking",
  "sunsets",
  "events",
];

function normalizeIsland(value?: string): VIConnectIsland {
  if (
    value === "st_thomas" ||
    value === "st_john" ||
    value === "st_croix" ||
    value === "water_island"
  ) {
    return value;
  }

  return "st_thomas";
}

function islandLabel(value: VIConnectIsland) {
  return islandOptions.find((option) => option.value === value)?.label || "St. Thomas";
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function profileReadiness({
  displayName,
  age,
  headline,
  bio,
  intent,
  interests,
  favoriteSpot,
  photos,
}: {
  displayName: string;
  age: number;
  headline: string;
  bio: string;
  intent: VIConnectIntent[];
  interests: string[];
  favoriteSpot: string;
  photos: string[];
}) {
  let score = 0;

  if (displayName.trim()) score += 12;
  if (age >= 18) score += 12;
  if (headline.trim()) score += 14;
  if (bio.trim().length >= 20) score += 18;
  if (intent.length) score += 12;
  if (interests.length >= 3) score += 14;
  if (favoriteSpot.trim()) score += 8;
  if (photos.length) score += 10;

  return Math.min(score, 100);
}

export default function VIConnectOnboarding({
  selectedIsland,
  existingProfile,
  onComplete,
  onCancel,
}: VIConnectOnboardingProps) {
  const initialPhotos = useMemo(() => {
    const photos = existingProfile?.photoUrls?.filter(Boolean) || [];
    const primary = existingProfile?.primaryPhotoUrl || existingProfile?.imageUrl || "";

    return Array.from(new Set([primary, ...photos].filter(Boolean)));
  }, [existingProfile]);

  const [displayName, setDisplayName] = useState(existingProfile?.displayName || "");
  const [age, setAge] = useState(String(existingProfile?.age || ""));
  const [island, setIsland] = useState<VIConnectIsland>(
    existingProfile?.island || normalizeIsland(selectedIsland)
  );
  const [status, setStatus] = useState<VIConnectStatus>(
    existingProfile?.status || "local"
  );
  const [headline, setHeadline] = useState(existingProfile?.headline || "");
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [favoriteSpot, setFavoriteSpot] = useState(existingProfile?.favoriteSpot || "");
  const [intent, setIntent] = useState<VIConnectIntent[]>(
    existingProfile?.intent?.length ? existingProfile.intent : ["dating"]
  );
  const [interests, setInterests] = useState<string[]>(
    existingProfile?.interests?.length ? existingProfile.interests : []
  );
  const [lookingFor, setLookingFor] = useState<string[]>(
    existingProfile?.lookingFor?.length ? existingProfile.lookingFor : []
  );
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState(
    existingProfile?.primaryPhotoUrl || existingProfile?.imageUrl || initialPhotos[0] || ""
  );

  const numericAge = Number(age);
  const readiness = profileReadiness({
    displayName,
    age: numericAge,
    headline,
    bio,
    intent,
    interests,
    favoriteSpot,
    photos,
  });

  const canSave = displayName.trim() && numericAge >= 18 && headline.trim();

  async function saveProfile() {
    if (!canSave) return;

    const cleanPhotos = photos.filter(Boolean);
    const primary = primaryPhotoUrl || cleanPhotos[0] || "";

    const profile = await saveVIConnectUserProfile({
      id: existingProfile?.id || "my-vi-connect-profile",
      displayName: displayName.trim(),
      age: numericAge,
      island,
      status,
      headline: headline.trim(),
      bio: bio.trim(),
      favoriteSpot: favoriteSpot.trim(),
      intent,
      interests,
      lookingFor,
      imageUrl: primary || undefined,
      primaryPhotoUrl: primary || undefined,
      photoUrls: cleanPhotos,
      isVisible: existingProfile?.isVisible ?? true,
      verificationStatus: existingProfile?.verificationStatus || "pending",
      verified: existingProfile?.verified ?? false,
      visibility:
        existingProfile?.visibility ??
        ("public" as VIConnectUserProfile["visibility"]),
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    onComplete(profile);
  }

  return (
    <main className="min-h-screen bg-[#f8f0da] px-4 py-6 pb-56 text-white md:px-6">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2.75rem] bg-[#071827] shadow-2xl">
        <div className="relative overflow-hidden border-b border-white/10 p-5 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(34,211,238,0.25),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(250,204,21,0.16),transparent_30%)]" />

          <div className="relative flex justify-between gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={saveProfile}
              disabled={!canSave}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              Save profile
            </button>
          </div>

          <div className="relative mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 ring-1 ring-cyan-200/20">
                <UserPlus className="h-4 w-4" />
                Create Your VI Connect Profile
              </div>

              <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-tight text-white md:text-7xl">
                Build a profile that feels real.
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-300 md:text-lg">
                Add your best photos, island context, intentions, interests, and a
                safe first-meetup vibe.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
                Profile readiness
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300"
                  style={{ width: `${readiness}%` }}
                />
              </div>

              <p className="mt-4 text-lg font-black text-white">
                {readiness}% complete
              </p>

              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-100" />
                  18+ adults only
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-cyan-100" />
                  General island location only
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-100" />
                  Photo verification comes next
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="grid gap-6">
            <VIConnectPhotoManager
              photos={photos}
              primaryPhotoUrl={primaryPhotoUrl}
              onChange={(next) => {
                setPhotos(next.photos);
                setPrimaryPhotoUrl(next.primaryPhotoUrl);
              }}
            />

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                    Display name
                  </span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                    placeholder="Name shown on profile"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                    Age
                  </span>
                  <input
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    type="number"
                    min={18}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                    placeholder="18+"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                    Island
                  </span>
                  <select
                    value={island}
                    onChange={(event) => setIsland(event.target.value as VIConnectIsland)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                  >
                    {islandOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as VIConnectStatus)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                  Headline
                </span>
                <input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                  placeholder="Example: Beach walks, good food, and real conversation."
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                  Bio
                </span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="min-h-36 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-semibold leading-7 text-white outline-none focus:border-cyan-300"
                  placeholder="Tell people your vibe, what you enjoy, and what kind of connection you want."
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
                  Favorite VI spot
                </span>
                <input
                  value={favoriteSpot}
                  onChange={(event) => setFavoriteSpot(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-black text-white outline-none focus:border-cyan-300"
                  placeholder="Magens Bay, Christiansted boardwalk, Coral Bay..."
                />
              </label>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                Intent
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {intentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setIntent((current) => toggleValue(current, option.value))}
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      intent.includes(option.value)
                        ? "bg-cyan-300 text-slate-950"
                        : "bg-white/10 text-white ring-1 ring-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                Interests
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => setInterests((current) => toggleValue(current, interest))}
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      interests.includes(interest)
                        ? "bg-emerald-300 text-slate-950"
                        : "bg-white/10 text-white ring-1 ring-white/10"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                Looking for
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["real conversation", "public first meetups", "serious dating", "new friends", "events", "local recommendations"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLookingFor((current) => toggleValue(current, item))}
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      lookingFor.includes(item)
                        ? "bg-amber-300 text-slate-950"
                        : "bg-white/10 text-white ring-1 ring-white/10"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950 shadow-2xl">
              <div className="relative min-h-[420px] bg-gradient-to-br from-cyan-500/20 via-blue-700/20 to-amber-300/15">
                {primaryPhotoUrl ? (
                  <>
                    <img
                      src={primaryPhotoUrl}
                      alt="Profile preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/10" />
                  </>
                ) : null}

                <div className="relative flex h-full min-h-[420px] flex-col justify-end p-5">
                  <div className="mb-auto grid h-20 w-20 place-items-center rounded-[1.75rem] border border-white/20 bg-white/15 text-3xl font-black text-white backdrop-blur">
                    {displayName.trim()?.[0]?.toUpperCase() || "VI"}
                  </div>

                  <h3 className="font-serif text-5xl text-white">
                    {displayName || "Your name"}
                    {numericAge >= 18 ? `, ${numericAge}` : ""}
                  </h3>

                  <p className="mt-2 text-sm font-black text-cyan-100">
                    {islandLabel(island)} · {statusOptions.find((item) => item.value === status)?.label}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xl font-black leading-7 text-white">
                  {headline || "Add a headline that makes people want to say hello."}
                </p>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                  {bio || "Your bio preview will appear here as you build your VI Connect profile."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {intent.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100 ring-1 ring-cyan-200/10"
                    >
                      {intentOptions.find((option) => option.value === item)?.label || item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {interests.slice(0, 6).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-slate-200"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={!canSave}
                  className="mt-6 w-full rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save VI Connect Profile
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
