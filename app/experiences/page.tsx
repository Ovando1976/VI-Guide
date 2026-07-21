import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  BOOKABLE_EXPERIENCES,
  ISLAND_NAMES,
  type BookableExperience,
} from "@/lib/bookable-experiences";

export const metadata = {
  title: "Tours & Experiences | VI Guide",
  description:
    "Browse and request tours and experiences across St. Thomas, St. John, and St. Croix.",
};

export default function ExperiencesPage() {
  const tours = BOOKABLE_EXPERIENCES.filter((item) => item.kind === "tour");
  const experiences = BOOKABLE_EXPERIENCES.filter(
    (item) => item.kind === "experience",
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-9">
        <section className="overflow-hidden rounded-[38px] bg-[#043331] p-7 text-white shadow-[0_30px_80px_rgba(4,51,49,.2)] sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.23em] text-[#f5c451]">
                <Sparkles className="h-4 w-4" /> VI Guide Booking Platform
              </div>
              <h1 className="mt-5 max-w-4xl text-[clamp(3rem,7vw,6.4rem)] font-black leading-[.9] tracking-[-.065em]">
                Book the island, not just a room.
              </h1>
              <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-white/68">
                Request tours and local experiences across the territory, then connect them to your itinerary, map, concierge, and transportation.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[.06] p-6">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7ce0d4]" />
                <p className="text-sm font-semibold leading-6 text-white/66">
                  These are booking requests. Availability, final pricing, operator confirmation, and payment instructions follow after review.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CatalogSection
          eyebrow="Guided routes"
          title="Tours"
          description="Structured island days with transportation-aware timing and connected stops."
          items={tours}
        />

        <CatalogSection
          eyebrow="Local moments"
          title="Experiences"
          description="Focused activities and memorable moments that can fit into a larger VI Guide journey."
          items={experiences}
        />

        <section className="grid gap-5 md:grid-cols-3">
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
            text="Continue into Concierge, Journey Planner, Map, and Mobility without rebuilding the trip."
          />
        </section>
      </div>
    </main>
  );
}

function CatalogSection({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: BookableExperience[];
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-700">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-black tracking-[-.05em]">{title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
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

  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#edf6f2] px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-teal-800">
          {item.kind}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400">
          <Clock3 className="h-4 w-4" /> {item.duration}
        </span>
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-[-.04em]">{item.name}</h3>
      <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-teal-800">
        <MapPin className="h-4 w-4" /> {item.location}
      </div>
      <p className="mt-4 flex-1 text-sm font-semibold leading-6 text-slate-600">
        {item.summary}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.highlights.map((highlight) => (
          <span
            key={highlight}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.12em] text-slate-500"
          >
            {highlight}
          </span>
        ))}
      </div>
      <div className="mt-6 grid gap-2">
        <Link
          href={`/book?${params.toString()}`}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5b942] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] transition hover:bg-[#ffca55]"
        >
          Request booking <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/concierge?island=${item.island}&context=${item.kind}&prompt=${encodeURIComponent(conciergePrompt)}`}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-[10px] font-black uppercase tracking-[.16em] transition hover:border-teal-600"
        >
          Plan around this
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
    <div className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}
