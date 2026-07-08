import {
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  Compass,
  CreditCard,
  Hotel,
  LockKeyhole,
  MapPinned,
  Menu,
  MessageSquareText,
  Plane,
  Search,
  Ship,
  Sparkles,
  SunMedium,
  Users,
  Utensils,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
import FeaturedIslandPicks from "./FeaturedIslandPicks";
  homepageCards,
  homepageFeatureImages,
  homepageHeroImage,
} from "../data/generated/homepageImages";

type VisitorHomeProps = {
  selectedIsland?: string;
  onNavigate?: (path: string) => void;
  onSelectListing?: unknown;
  user?: unknown;
};

type FeatureCard = {
  label: string;
  title: string;
  text: string;
  path: string;
  icon: LucideIcon;
  featured?: boolean;
};

type SmallAction = {
  label: string;
  path: string;
  icon: LucideIcon;
};

const visitorActions: FeatureCard[] = [
  {
    label: "Start here",
    title: "Plan my visit",
    text: "Build a day plan, map stops, check routes, and save your trip flow.",
    path: "/visitor-desk",
    icon: Compass,
    featured: true,
  },
  {
    label: "Stays & booking",
    title: "Hotels, villas & charters",
    text: "Request lodging, boat days, tours, pickup help, and local recommendations.",
    path: "/hotels",
    icon: Hotel,
  },
  {
    label: "Getting around",
    title: "Ride & route preview",
    text: "Preview routes and request transportation with better pickup context.",
    path: "/mobility",
    icon: Car,
  },
];

const exploreActions: SmallAction[] = [
  { label: "Map", path: "/map", icon: MapPinned },
  { label: "Cruise Planner", path: "/cruise-planner", icon: Ship },
  { label: "Beaches", path: "/beaches", icon: Waves },
  { label: "Explore", path: "/explore", icon: Compass },
  { label: "Events", path: "/events", icon: CalendarDays },
  { label: "Accommodations",
    path: "/hotels",
    icon: BedDouble,
  },
  {
    label: "Restaurants",
    path: "/eat",
    icon: Utensils,
  },
  {
    label: "VI Connect", path: "/connect", icon: Users },
  { label: "Concierge", path: "/concierge", icon: MessageSquareText },
];

const trustItems = [
  "Road previews for trip planning",
  "Hotels, villas, charters, and tours",
  "Partner-managed listings",
  "Visitor pass access controls",
];

function islandName(value?: string) {
  if (!value) return "St. Thomas";

  return (
    {
      st_thomas: "St. Thomas",
      st_john: "St. John",
      st_croix: "St. Croix",
      water_island: "Water Island",
    }[value] || value.replace(/_/g, " ")
  );
}

export default function VisitorHome({
  selectedIsland = "st_thomas",
  onNavigate,
}: VisitorHomeProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }

    navigate(path);
  };

  const island = islandName(selectedIsland);

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-72 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="flex items-center justify-between rounded-full bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => go("/visitor-desk")}
            className="flex items-center gap-3 active:scale-95"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-950 text-turquoise">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-black">VI Guide</span>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
                Virgin Islands
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go("/account")}
              className="hidden rounded-full bg-stone-100 px-4 py-3 text-xs font-black text-ink active:scale-95 md:inline-flex"
            >
              Account
            </button>

            <button
              type="button"
              onClick={() => go("/visitor-checkout")}
              className="rounded-full bg-[#ffcf32] px-4 py-3 text-xs font-black text-ink shadow-sm active:scale-95"
            >
              Visitor Pass
            </button>

            <button
              type="button"
              onClick={() => go("/visitor-desk")}
              className="grid h-11 w-11 place-items-center rounded-full bg-ink text-white active:scale-95"
              aria-label="Open visitor desk"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2.75rem] bg-emerald-950 text-white shadow-2xl">
          <div className="relative min-h-[520px] p-6 md:p-8 lg:min-h-[560px]">
            <div className="absolute inset-0">
              <img
                src={homepageHeroImage}
                alt="Virgin Islands marina and island scenery"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-950/80 to-ink/85" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(64,220,202,0.35),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(255,207,50,0.25),transparent_28%)]" />
            </div>

            <div className="relative z-10 grid min-h-[460px] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-turquoise">
                  <SunMedium className="h-4 w-4" />
                  {island} today
                </div>

                <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl lg:text-7xl xl:text-8xl">
                  Your island day, organized.
                </h1>

                <p className="mt-6 max-w-2xl text-base font-bold leading-8 text-white/75 md:text-lg">
                  Plan where to go, where to stay, how to get around, and what
                  to book across the U.S. Virgin Islands.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => go("/visitor-desk")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ffcf32] px-6 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
                  >
                    Start planning
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => go("/hotels")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
                  >
                    Find stays & charters
                    <BedDouble className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {trustItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/85"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-turquoise" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-7 hidden grid-cols-3 gap-3 md:grid">
                  {homepageFeatureImages.map((src) => (
                    <div
                      key={src}
                      className="h-24 overflow-hidden rounded-2xl bg-white/10 shadow-lg md:h-32"
                    >
                      <img
                        src={src}
                        alt="Virgin Islands preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.5rem] bg-white p-4 text-ink shadow-2xl md:p-5">
                <div className="rounded-[2rem] bg-[#f8f0da] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Trip snapshot
                  </p>

                  <div className="mt-4 grid gap-3">
                    <TripRow
                      icon={Plane}
                      label="Arrival"
                      title="Airport, cruise, ferry, or hotel pickup"
                    />
                    <TripRow
                      icon={MapPinned}
                      label="Discover"
                      title="Beaches, food, history, events, and local places"
                    />
                    <TripRow
                      icon={Car}
                      label="Move"
                      title="Road previews and mobility handoff"
                    />
                    <TripRow
                      icon={CreditCard}
                      label="Unlock"
                      title="Visitor pass for premium trip tools"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => go("/visitor-checkout")}
                    className="mt-5 flex w-full items-center justify-between rounded-2xl bg-ink px-5 py-4 text-left text-sm font-black text-white active:scale-95"
                  >
                    <span>
                      <span className="block text-[10px] uppercase tracking-[0.18em] text-turquoise">
                        Premium access
                      </span>
                      <span className="mt-1 block">Unlock visitor pass</span>
                    </span>
                    <BadgeDollarSign className="h-5 w-5 text-[#ffcf32]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {visitorActions.map((card) => (
            <button
              key={card.path}
              type="button"
              onClick={() => go(card.path)}
              className={`group rounded-[2.25rem] p-5 text-left shadow-xl active:scale-95 ${
                card.featured ? "bg-[#ffcf32] text-ink" : "bg-white text-ink"
              }`}
            >
              <div className="mb-5 h-32 overflow-hidden rounded-[1.75rem] bg-stone-100 md:h-36">
                <img
                  src={
                    card.path === "/visitor-desk"
                      ? homepageCards.plan
                      : card.path === "/hotels"
                      ? homepageCards.stays
                      : homepageCards.mobility
                  }
                  alt={card.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl ${
                  card.featured
                    ? "bg-ink text-[#ffcf32]"
                    : "bg-emerald-950 text-turquoise"
                }`}
              >
                <card.icon className="h-7 w-7" />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                {card.label}
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                {card.title}
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-stone-600">
                {card.text}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-[2.5rem] bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Explore faster
              </p>
              <h2 className="mt-2 font-serif text-4xl">
                Choose what you need next.
              </h2>
            </div>

            <label className="relative block md:w-[360px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <button
                type="button"
                onClick={() => go("/concierge")}
                className="w-full rounded-2xl bg-stone-50 py-4 pl-12 pr-4 text-left text-sm font-bold text-stone-500 active:scale-95"
              >
                Ask VI Guide anything...
              </button>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exploreActions.map((action) => (
              <button
                key={action.path}
                type="button"
                onClick={() =>
                  go(
                    action.path === "/connect"
                      ? `/connect?island=${selectedIsland}`
                      : action.path
                  )
                }
                className="flex items-center justify-between rounded-2xl bg-stone-50 p-4 text-left active:scale-95"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-black">{action.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </button>
            ))}
          </div>
        </section>

              <FeaturedIslandPicks selectedIsland={selectedIsland} />

<section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <article className="rounded-[2.5rem] bg-white p-5 shadow-xl md:p-6">
            <div className="mb-5 h-36 overflow-hidden rounded-[2rem] bg-stone-100 md:h-44">
              <img
                src={homepageCards.pass}
                alt="Virgin Islands beach visitor pass"
                className="h-full w-full object-cover"
              />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Premium visitor pass
            </p>

            <h2 className="mt-2 font-serif text-4xl">
              Unlock better planning for the whole trip.
            </h2>

            <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-stone-500">
              Use a visitor pass to access the organized visitor desk, premium
              trip planning, route previews, and booking tools.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <PassMini label="Cruise Day" price="$9" />
              <PassMini label="Trip Pass" price="$19" featured />
              <PassMini label="Concierge" price="$49" />
            </div>

            <button
              type="button"
              onClick={() => go("/visitor-checkout")}
              className="mt-5 rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-black text-white active:scale-95"
            >
              View visitor pass options
            </button>
          </article>

          <article className="overflow-hidden rounded-[2.5rem] bg-ink text-white shadow-xl">
            <div className="h-40 bg-stone-900 md:h-52">
              <img
                src={homepageCards.partner}
                alt="Virgin Islands local partner business"
                className="h-full w-full object-cover opacity-80"
              />
            </div>

            <div className="p-5 md:p-6">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-turquoise text-ink">
                <Hotel className="h-7 w-7" />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-turquoise">
                Local partners
              </p>

              <h2 className="mt-2 font-serif text-4xl">
                Hotels, villas, charters, tours, and local businesses.
              </h2>

              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                Claim your listing, manage booking inquiries, and connect with
                visitors planning a Virgin Islands trip.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => go("/partner-desk")}
                  className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Partner access
                </button>

                <button
                  type="button"
                  onClick={() => go("/accommodation-partner")}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white active:scale-95"
                >
                  Claim a business
                </button>
              </div>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function TripRow({
  icon: Icon,
  label,
  title,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </span>

      <span>
        <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
          {label}
        </span>
        <span className="mt-1 block text-sm font-black">{title}</span>
      </span>
    </div>
  );
}

function PassMini({
  label,
  price,
  featured,
}: {
  label: string;
  price: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        featured ? "bg-[#ffcf32] text-ink" : "bg-stone-50 text-ink"
      }`}
    >
      <LockKeyhole className="h-5 w-5 text-emerald-700" />
      <p className="mt-3 text-sm font-black">{label}</p>
      <p className="mt-1 text-3xl font-black">{price}</p>
    </div>
  );
}
