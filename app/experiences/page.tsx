import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Compass,
  ExternalLink,
  MapPin,
  MapPinned,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import {
  ACTIVITY_CATEGORY_LABELS,
  BOOKABLE_EXPERIENCES,
  ISLAND_NAMES,
  type ActivityCategory,
  type BookableExperience,
} from "@/lib/bookable-experiences";

export const metadata = {
  title: "Tours & Experiences | VI Guide",
  description:
    "Browse and request tours and experiences across St. Thomas, St. John, and St. Croix.",
};

const EXPERIENCE_IMAGES: Record<string, { image: string; alt: string }> = {
  "stt-island-highlights": {
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
  },
  "stt-harbor-sunset": {
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor in St. Thomas",
  },
  "stj-north-shore-day": {
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay and the green North Shore of St. John",
  },
  "stj-heritage-nature": {
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
    alt: "Green hills and clear water on St. John",
  },
  "stx-christiansted-culture": {
    image: "/images/accommodations/king-christian-hotel.jpg",
    alt: "Historic waterfront architecture in Christiansted, St. Croix",
  },
  "stx-west-end-sunset": {
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "St. Croix coastline at Cane Bay",
  },
};

const DEFAULT_EXPERIENCE_IMAGE = {
  image: "/images/usvi-harbor-hero.jpg",
  alt: "Scenic view in the U.S. Virgin Islands",
};

type ActivitySearchParams = {
  q?: string;
  island?: string;
  category?: string;
};

export default function ExperiencesPage({
  searchParams,
}: {
  searchParams?: ActivitySearchParams;
}) {
  const query = searchParams?.q?.trim().toLowerCase() ?? "";
  const island = searchParams?.island ?? "all";
  const category = searchParams?.category ?? "all";
  const filteredActivities = BOOKABLE_EXPERIENCES.filter((item) => {
    const matchesIsland = island === "all" || item.island === island;
    const matchesCategory = category === "all" || item.category === category;
    const searchable = [
      item.name,
      item.operator,
      item.location,
      item.summary,
      ACTIVITY_CATEGORY_LABELS[item.category],
      ...item.highlights,
    ].join(" ").toLowerCase();
    return matchesIsland && matchesCategory && (!query || searchable.includes(query));
  });
  const scuba = filteredActivities.filter((item) => item.category === "scuba");
  const sailingAndCharters = filteredActivities.filter(
    (item) => item.category === "sailing" || item.category === "boat-charter",
  );
  const otherActivities = filteredActivities.filter(
    (item) => !["scuba", "sailing", "boat-charter"].includes(item.category),
  );
  const operatorCount = new Set(BOOKABLE_EXPERIENCES.map((item) => item.operator)).size;
  const categories = Object.entries(ACTIVITY_CATEGORY_LABELS) as [
    ActivityCategory,
    string,
  ][];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/places/st-john/trunk-bay-overlook-1.jpg"
          alt="Trunk Bay and the North Shore of St. John"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.94)_42%,rgba(3,47,45,.56)_76%,rgba(3,47,45,.26)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(115,227,217,.2),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.5))]" />

        <ViPublicHeader
          actionHref="/bookings"
          actionLabel="Track booking"
          actionIcon={SearchCheck}
          secondaryHref="/"
          secondaryLabel="Home"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875] backdrop-blur-xl">
              <Sparkles size={14} /> Tours & experiences · connected booking
            </div>
            <h1 className="vi-display mt-7 max-w-4xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Book the island,
              <span className="block italic text-[#73e3d9]">not just a room.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/76 sm:text-xl sm:leading-8">
              Choose island days that already understand place, timing, transportation, and the rest of your VI Guide trip. Request the experience, then keep planning without starting over.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#activity-search-title"
                className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                Browse experiences <ArrowRight size={15} />
              </Link>
              <Link
                href="/concierge?prompt=Help%20me%20choose%20and%20plan%20a%20tour%20or%20experience%20for%20my%20Virgin%20Islands%20trip"
                className="vi-glass inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.16]"
              >
                <Sparkles size={17} className="text-[#73e3d9]" /> Ask Concierge
              </Link>
            </div>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#73e3d9]" />
              <div>
                <div className="vi-eyebrow text-[#f5c451]">Booking confidence</div>
                <h2 className="vi-display mt-3 text-3xl font-bold text-white">
                  Request first. Confirm before you depend on it.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
                  Availability, final pricing, operator confirmation, and payment instructions follow after review. VI Guide keeps the request connected to your trip while that happens.
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <HeroStat value={String(BOOKABLE_EXPERIENCES.length)} label="experiences" />
              <HeroStat value={String(operatorCount)} label="operators" />
              <HeroStat value="3" label="islands" />
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <section aria-labelledby="activity-search-title" className="rounded-[32px] border border-[#d9e6e2] bg-[#fffdf8] p-5 shadow-[0_16px_45px_rgba(4,51,49,.08)] sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="vi-eyebrow text-[#0f766e]">Find your activity</p>
              <h2 id="activity-search-title" className="vi-display mt-2 text-3xl font-bold sm:text-4xl">Search all 42 verified experiences</h2>
            </div>
            <p aria-live="polite" className="rounded-full bg-[#eaf8f5] px-4 py-2 text-xs font-black text-[#0f766e]">
              {filteredActivities.length} {filteredActivities.length === 1 ? "result" : "results"}
            </p>
          </div>
          <form action="/activities" method="get" className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">
            <label className="relative">
              <span className="sr-only">Search activities or operators</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0f766e]" />
              <input name="q" defaultValue={searchParams?.q ?? ""} placeholder="Search scuba, fishing, operator..." className="min-h-13 w-full rounded-2xl border border-[#cfe0dc] bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#73e3d9]/40" />
            </label>
            <label>
              <span className="sr-only">Filter by island</span>
              <select name="island" defaultValue={island} className="min-h-13 w-full rounded-2xl border border-[#cfe0dc] bg-white px-4 text-sm font-bold outline-none focus:border-[#0f766e]">
                <option value="all">All islands</option>
                <option value="stt">St. Thomas</option>
                <option value="stj">St. John</option>
                <option value="stx">St. Croix</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by category</span>
              <select name="category" defaultValue={category} className="min-h-13 w-full rounded-2xl border border-[#cfe0dc] bg-white px-4 text-sm font-bold outline-none focus:border-[#0f766e]">
                <option value="all">All categories</option>
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="submit" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#032f2d] px-6 text-[10px] font-black uppercase tracking-[.14em] text-white transition hover:bg-[#075e58]">
              <Search className="h-4 w-4" /> Search
            </button>
          </form>
          {(query || island !== "all" || category !== "all") && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-[#607370]">
              <span>Filters are reflected in this page URL, so you can share these results.</span>
              <Link href="/activities" className="text-[#0f766e] underline decoration-[#73e3d9] decoration-2 underline-offset-4">Clear all filters</Link>
            </div>
          )}
        </section>

        {filteredActivities.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-[#b8dcd6] bg-[#eaf8f5] p-8 text-center sm:p-12">
            <h2 className="vi-display text-3xl font-bold">No exact matches yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#607370]">Clear a filter, try a broader search, or ask Concierge to find the closest available alternative.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/activities" className="rounded-full bg-[#032f2d] px-5 py-3 text-[10px] font-black uppercase tracking-[.14em] text-white">View all activities</Link>
              <Link href="/concierge?prompt=Help%20me%20find%20an%20activity%20in%20the%20USVI" className="rounded-full border border-[#0f766e] px-5 py-3 text-[10px] font-black uppercase tracking-[.14em] text-[#0f766e]">Ask Concierge</Link>
            </div>
          </section>
        ) : (
          <>
        <CatalogSection
          id="scuba"
          eyebrow="Dive operators across all three islands"
          title="Scuba diving"
          description="Certified dives, Discover Scuba, instruction, reef, wall, wreck, shore, and private dive-charter options."
          items={scuba}
        />

        <CatalogSection
          id="sailing-charters"
          eyebrow="Day sails, private yachts, and multi-day cruising"
          title="Sailing & charters"
          description="Catamarans, sunset sails, bareboats, crewed yachts, powerboats, and custom island-hopping itineraries."
          items={sailingAndCharters}
        />

        <CatalogSection
          id="activities"
          eyebrow="More ways to explore"
          title="All other activities"
          description="Sportfishing, jet skiing, paddleboarding, horseback riding, food tours, snorkeling, kayaking, hiking, wildlife encounters, and more."
          items={otherActivities}
        />

          </>
        )}

        <section className="rounded-[36px] bg-[#032f2d] p-6 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-9 lg:p-11">
          <div className="max-w-3xl">
            <div className="vi-eyebrow text-[#f5c451]">How booking stays connected</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] sm:text-5xl">
              One request should strengthen the whole trip.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature
              icon={CalendarDays}
              title="Request"
              text="Choose a date, preferred time, party size, and special requirements."
            />
            <Feature
              icon={BadgeCheck}
              title="Review"
              text="VI Guide records a unique reference and sends the request into the booking workflow."
            />
            <Feature
              icon={Compass}
              title="Connect"
              text="Continue into Concierge, My Trip, Living Map, and Mobility without rebuilding the plan."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function CatalogSection({
  id,
  eyebrow,
  title,
  description,
  items,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: BookableExperience[];
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="vi-eyebrow text-[#0f766e]">{eyebrow}</p>
          <h2 className="vi-display mt-2 text-4xl font-bold tracking-[-.04em] sm:text-5xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#607370]">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <BookingCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({ item }: { item: BookableExperience }) {
  const params = new URLSearchParams({
    kind: item.kind,
    island: item.island,
    listingId: item.id,
    listingName: item.name,
    listingHref: "/experiences",
    adults: "2",
  });
  const conciergePrompt = `Help me plan ${item.name} on ${ISLAND_NAMES[item.island]}. Include transportation, realistic timing, nearby places, and a backup option.`;
  const visual = EXPERIENCE_IMAGES[item.id] ?? DEFAULT_EXPERIENCE_IMAGE;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#d9e6e2] bg-[#fffdf8] shadow-[0_16px_45px_rgba(4,51,49,.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#aad7d0] hover:shadow-[0_28px_65px_rgba(4,51,49,.14)]">
      <div className="relative h-64 overflow-hidden sm:h-72">
        <Image
          src={visual.image}
          alt={visual.alt}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.05)_28%,rgba(3,47,45,.78)_100%)]" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/25 bg-[#043331]/78 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-white backdrop-blur-md">
            {ISLAND_NAMES[item.island]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-white backdrop-blur-md">
            <Clock3 className="h-3 w-3" /> {item.duration}
          </span>
        </div>
        <div className="absolute inset-x-5 bottom-5 text-white">
          <div className="text-[8px] font-black uppercase tracking-[.2em] text-[#f8d77c]">
            {ACTIVITY_CATEGORY_LABELS[item.category]}
          </div>
          <h3 className="vi-display mt-1 text-3xl font-bold leading-[.95] tracking-[-.04em]">
            {item.name}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="inline-flex items-center gap-2 text-xs font-black text-[#0f766e]">
          <MapPin className="h-4 w-4" /> {item.location}
        </div>
        <p className="mt-2 text-[10px] font-black uppercase tracking-[.13em] text-[#9b5d12]">{item.operator}</p>
        <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-[#5a6f6c]">
          {item.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-[#dce7e4] bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[.11em] text-[#49615e]"
            >
              {highlight}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[9px] font-semibold leading-4 text-slate-400">Verified {item.verifiedAt} · {item.sourceLabel} · {item.availabilityStatus.replaceAll("-", " ")}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[#e4ece9] pt-5">
          <Link
            href={`/map?island=${item.island}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dce7e4] bg-white px-3 text-[8px] font-black uppercase tracking-[.1em] text-[#35514e] transition hover:border-[#b8dcd6]"
          >
            <MapPinned className="h-4 w-4" /> Map island
          </Link>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dce7e4] bg-white px-3 text-[8px] font-black uppercase tracking-[.1em] text-[#35514e] transition hover:border-[#b8dcd6]">
            <ExternalLink className="h-4 w-4" /> Operator
          </a>
          <Link
            href={`/concierge?island=${item.island}&context=${item.kind}&prompt=${encodeURIComponent(conciergePrompt)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b8e2dc] bg-[#eaf8f5] px-3 text-[8px] font-black uppercase tracking-[.1em] text-[#0f766e] transition hover:bg-[#ddf3ee]"
          >
            <Sparkles className="h-4 w-4" /> Plan around this
          </Link>
        </div>

        <Link
          href={`/book?${params.toString()}`}
          className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:bg-[#075e58]"
        >
          Request booking <ArrowRight className="h-4 w-4 text-[#f5c451]" />
        </Link>
      </div>
    </article>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#73e3d9]/12 text-[#73e3d9]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/58">{text}</p>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.08] px-3 py-4 text-center">
      <strong className="vi-display block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[.14em] text-white/48">{label}</span>
    </div>
  );
}
