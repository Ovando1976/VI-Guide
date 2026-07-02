import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Car,
  Compass,
  Crown,
  Landmark,
  MapPin,
  MapPinned,
  MessageCircle,
  Route,
  Search,
  Ship,
  Sparkles,
  Store,
  Sun,
  Utensils,
  Waves,
} from "lucide-react";

import type { BeachDoc, IslandCode, PlaceDoc } from "../types";

type ListingSelection = BeachDoc | PlaceDoc;

type Props = {
  selectedIsland?: IslandCode;
  selectedIslandLabel?: string;
  onNavigate?: (path: string) => void;
  onSelectListing?: (listing: ListingSelection) => void;
};

const localImages = {
  hero: "/images/beaches/magens-bay.jpg",
  beaches: "/images/beaches/magens-bay.jpg",
  food: "/images/business/restaurants.jpg",
  events: "/images/events/events.jpg",
  history: "/images/historicSite/99-steps.jpg",
  mobility: "/images/beaches/brewers-bay.jpg",
  businesses: "/images/business/business-directory.jpg",
  downtown: "/images/dictionary/charlotte-amalie.jpg",
};

const islandAwarePaths = new Set([
  "/explore",
  "/map",
  "/mobility",
  "/concierge",
  "/beaches",
  "/eat",
  "/events",
  "/history",
  "/cruise",
  "/businesses",
  "/merchant",
]);

const coreSystems = [
  {
    title: "Atlas",
    subtitle: "Map, estates, parcels",
    path: "/map",
    icon: MapPinned,
    tone: "from-sky-300 to-blue-700",
  },
  {
    title: "Mobility",
    subtitle: "Taxi, safari, ferry",
    path: "/mobility",
    icon: Car,
    tone: "from-indigo-300 to-violet-700",
  },
  {
    title: "History",
    subtitle: "Archives, maps, records",
    path: "/history",
    icon: Landmark,
    tone: "from-amber-300 to-orange-700",
  },
  {
    title: "Explore",
    subtitle: "Beaches, food, events",
    path: "/explore",
    icon: Compass,
    tone: "from-emerald-300 to-teal-700",
  },
  {
    title: "Concierge",
    subtitle: "Ask the island",
    path: "/concierge",
    icon: MessageCircle,
    tone: "from-fuchsia-400 to-pink-700",
  },
] as const;

const todayStats = [
  ["84°", "Weather", Sun],
  ["3", "Cruise Ships", Ship],
  ["On Time", "Ferry", Route],
  ["6", "Events", CalendarDays],
  ["Live", "Taxi Demand", Car],
  ["Excellent", "Beaches", Waves],
] as const;

const discoveryCards = [
  ["Beaches", "Best beaches by mood, distance, and island.", "/beaches", Waves, localImages.beaches, "bg-emerald-500"],
  ["Food", "Restaurants, bars, cafés, and local favorites.", "/eat", Utensils, localImages.food, "bg-orange-500"],
  ["Events", "What is happening today and this week.", "/events", CalendarDays, localImages.events, "bg-violet-600"],
  ["Cruise Day", "Plan a complete port-day itinerary.", "/cruise", Ship, localImages.downtown, "bg-sky-600"],
] as const;

const mobilityLinks = [
  ["Taxi Fare", "/mobility?mode=taxi"],
  ["Safari Routes", "/mobility?mode=safari"],
  ["Bus Stops", "/mobility?mode=bus"],
  ["Ferry", "/mobility?mode=ferry"],
  ["Airport", "/mobility?mode=airport"],
  ["Cruise Pickup", "/mobility?mode=cruise"],
] as const;

const historyLinks = [
  ["Timeline", "/history?view=timeline"],
  ["Governors", "/history?view=governors"],
  ["Historic Maps", "/map?filter=history"],
  ["Archives", "/history/archives"],
  ["Dictionary", "/dictionary"],
  ["Historic Sites", "/map?filter=history"],
] as const;

function bg(path: string) {
  return { backgroundImage: `url("${path}")` };
}

export default function VisitorHome({
  selectedIsland = "st_thomas",
  selectedIslandLabel = "St. Thomas",
  onNavigate,
}: Props) {
  const navigate = useNavigate();

  function go(path: string) {
    const hasQuery = path.includes("?");
    const nextPath = islandAwarePaths.has(path.split("?")[0])
      ? `${path}${hasQuery ? "&" : "?"}island=${selectedIsland}`
      : path;

    if (onNavigate) onNavigate(nextPath);
    else navigate(nextPath);
  }

  return (
    <main className="min-h-screen bg-[#061016] pb-32 text-white">
      <section className="relative overflow-hidden rounded-b-[2.75rem]">
        <div className="absolute inset-0 bg-cover bg-center" style={bg(localImages.hero)} />
        <div className="absolute inset-0 bg-gradient-to-br from-black/96 via-slate-950/88 to-emerald-950/65" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(16,185,129,0.36),transparent_34%),radial-gradient(circle_at_88%_0%,rgba(251,191,36,0.2),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-5 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => go("/")}
              className="flex items-center gap-3 text-left transition hover:opacity-90 active:scale-95"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full border border-emerald-300/40 bg-black/30 text-lg font-black shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                VI
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-300">VI Guide</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                  Territory Operating System
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go("/map")}
                className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold shadow-xl backdrop-blur transition hover:bg-white/15 active:scale-95 sm:flex"
              >
                <MapPin className="h-4 w-4" />
                {selectedIslandLabel}
              </button>

              <button
                type="button"
                onClick={() => go("/events")}
                className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/15 active:scale-95"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>
          </header>

          <section className="mx-auto mt-10 max-w-4xl text-center">
            <button
              type="button"
              onClick={() => go("/concierge")}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-black/30 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_28px_rgba(16,185,129,0.28)] backdrop-blur transition hover:bg-emerald-300 hover:text-slate-950 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Virgin Islands OS
            </button>

            <h1 className="mt-5 text-5xl font-black leading-none tracking-tight sm:text-7xl">
              {selectedIslandLabel}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/78">
              One system for maps, mobility, history, beaches, businesses,
              documents, events, and AI-powered local intelligence.
            </p>

            <button
              type="button"
              onClick={() => go("/explore")}
              className="mx-auto mt-6 flex w-full max-w-2xl items-center gap-3 rounded-[1.75rem] border border-white/15 bg-slate-950/65 px-5 py-4 text-left shadow-2xl backdrop-blur transition hover:border-emerald-300/50 active:scale-[0.99]"
            >
              <Search className="h-5 w-5 text-emerald-300" />
              <span className="flex-1 text-sm font-semibold text-white/72">
                Search beaches, estates, parcels, routes, history, businesses, events...
              </span>
            </button>

            <div className="mx-auto mt-6 grid max-w-4xl grid-cols-5 gap-2 sm:gap-3">
              {coreSystems.map(({ title, subtitle, path, icon: Icon, tone }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => go(path)}
                  className="group rounded-3xl border border-white/12 bg-white/10 p-3 text-center shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 active:scale-95"
                >
                  <div className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} shadow-lg transition group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-[11px] font-black sm:text-sm">{title}</p>
                  <p className="mt-1 hidden text-[10px] text-white/60 sm:block">
                    {subtitle}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {todayStats.map(([value, label, Icon]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl"
            >
              <Icon className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-xl font-black">{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                {label}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <FeatureSystem
            icon={Car}
            title="Territory Mobility"
            label="Transportation System"
            description="Taxi fares, Safari routes, bus stops, ferry terminals, cruise ports, airport transfers, pickup zones, route planning, and transportation intelligence."
            button="Open Mobility"
            tone="sky"
            onClick={() => go("/mobility")}
          >
            {mobilityLinks.map(([label, path]) => (
              <MiniLink key={path} label={label} onClick={() => go(path)} />
            ))}
          </FeatureSystem>

          <FeatureSystem
            icon={Crown}
            title="Historical Atlas"
            label="Featured Knowledge System"
            description="Governors, estates, historical maps, timelines, archive records, dictionary evidence, and historic sites in one connected knowledge base."
            button="Open History"
            tone="amber"
            onClick={() => go("/history")}
          >
            {historyLinks.map(([label, path]) => (
              <MiniLink key={path} label={label} onClick={() => go(path)} />
            ))}
          </FeatureSystem>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-300">Discover</p>
              <h2 className="text-4xl font-black tracking-tight">Explore the island</h2>
            </div>

            <button
              type="button"
              onClick={() => go("/map")}
              className="hidden rounded-full border border-emerald-300/40 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-300 hover:text-slate-950 sm:block"
            >
              Open Map
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {discoveryCards.map(([title, description, path, Icon, image, tone]) => (
              <button
                key={path}
                type="button"
                onClick={() => go(path)}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-white text-left text-slate-950 shadow-xl transition hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className="relative h-36 bg-cover bg-center" style={bg(image)}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className={`absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl ${tone} text-white shadow-lg`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <AlertTriangle className="h-4 w-4" />
              Live Island Intelligence
            </p>
            <h2 className="mt-1 text-3xl font-black">Today at a glance</h2>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <InfoTile label="Cruise Ships" value="3" />
              <InfoTile label="Weather" value="84°" />
              <InfoTile label="Ferry" value="On Time" />
              <InfoTile label="Events" value="6" />
              <InfoTile label="Beach Conditions" value="Excellent" />
              <InfoTile label="Taxi Demand" value="Live" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950/70 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-cyan-200">Business + Merchant Hub</p>
                  <h2 className="text-3xl font-black">Local economy layer</h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/65">
                Browse local businesses, claim listings, and connect customers to services.
              </p>
            </div>

            <div className="grid grid-cols-4 divide-x divide-white/10 border-y border-white/10">
              <LiveStat value="254" label="Listings" />
              <LiveStat value="$49" label="Featured" />
              <LiveStat value="$99" label="Premium" />
              <LiveStat value="Live" label="Leads" />
            </div>

            <div className="grid grid-cols-2 gap-3 p-5">
              <button
                type="button"
                onClick={() => go("/businesses")}
                className="rounded-full border border-cyan-300/50 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"
              >
                Directory
              </button>
              <button
                type="button"
                onClick={() => go("/merchant")}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-105"
              >
                Merchant OS
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function FeatureSystem({
  icon: Icon,
  title,
  label,
  description,
  button,
  tone,
  onClick,
  children,
}: {
  icon: typeof Car;
  title: string;
  label: string;
  description: string;
  button: string;
  tone: "sky" | "amber";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const isSky = tone === "sky";

  return (
    <section
      className={`rounded-[2rem] border p-5 shadow-2xl ${
        isSky
          ? "border-sky-300/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),rgba(255,255,255,0.04)]"
          : "border-amber-300/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_35%),rgba(255,255,255,0.04)]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid h-12 w-12 place-items-center rounded-2xl text-slate-950 ${
            isSky ? "bg-sky-300" : "bg-amber-300"
          }`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black ${isSky ? "text-sky-300" : "text-amber-300"}`}>
            {label}
          </p>
          <h2 className="text-3xl font-black tracking-tight">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {children}
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`mt-5 w-full rounded-[1.5rem] p-4 text-left text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-1 hover:bg-white active:scale-[0.98] ${
          isSky ? "bg-sky-300" : "bg-amber-300"
        }`}
      >
        {button}
      </button>
    </section>
  );
}

function MiniLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left text-xs font-black text-white/75 transition hover:bg-white/12"
    >
      {label}
    </button>
  );
}

function LiveStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-[10px] text-white/65">{label}</p>
    </div>
  );
}

function InfoTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
    </div>
  );
}