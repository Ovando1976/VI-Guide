import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Fish,
  Landmark,
  Map,
  Navigation,
  Plane,
  Sprout,
  Waves,
} from "lucide-react";

const SYSTEMS = [
  {
    title: "Arrival intelligence",
    copy: "Connect Henry E. Rohlsen Airport, Christiansted arrivals, Frederiksted cruise activity, lodging, baggage, and onward transportation.",
    href: "/map?island=stx",
    icon: Plane,
  },
  {
    title: "Mobility intelligence",
    copy: "Plan official-tariff rides across longer east–west distances, airport transfers, twin-town movement, beaches, resorts, and rural estates.",
    href: "/mobility?island=stx",
    icon: Navigation,
  },
  {
    title: "Twin-town intelligence",
    copy: "Understand how Christiansted and Frederiksted anchor commerce, heritage, dining, events, ports, services, and cross-island movement.",
    href: "/places?island=stx",
    icon: Compass,
  },
  {
    title: "Beach intelligence",
    copy: "Explore north-shore, west-end, and south-shore beaches through public access, driving time, nearby estates, and practical trip planning.",
    href: "/beaches?island=stx",
    icon: Waves,
  },
  {
    title: "Heritage intelligence",
    copy: "Connect historic towns, forts, plantations, estates, industrial landscapes, archives, and the island’s layered cultural history.",
    href: "/heritage?island=stx",
    icon: Landmark,
  },
  {
    title: "Land and sea intelligence",
    copy: "See how agriculture, fishing, marine access, rural communities, food production, and coastal activity shape the island economy.",
    href: "/fishing?island=stx",
    icon: Fish,
  },
] as const;

export default function StCroixIntelligencePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.16),transparent_32%),linear-gradient(180deg,#f8f4ea_0%,#fff_52%,#f3f7f5_100%)] px-4 py-6 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,#032d2b_0%,#075b57_50%,#18a99e_100%)] px-6 py-9 text-white shadow-[0_28px_90px_rgba(4,51,49,.22)] sm:px-8 lg:px-10 lg:py-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                <Compass className="h-4 w-4" /> St. Croix intelligence
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl lg:text-6xl">
                Read the island through distance, twin towns, land, and sea.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                St. Croix intelligence connects airport arrival, Christiansted, Frederiksted, beaches, agriculture, fishing, heritage, rural estates, accommodations, commerce, and licensed mobility into one practical island view.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 backdrop-blur">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f7d778]">
                Primary operating spine
              </div>
              <div className="mt-3 text-2xl font-black tracking-[-.04em]">
                Airport → Christiansted → Frederiksted
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                Longer cross-island travel, two distinct town centers, rural estates, beach corridors, and dispersed visitor services make timing and route planning especially important.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SYSTEMS.map(({ title, copy, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-[30px] border border-[#0b5d5b]/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(4,51,49,.12)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800 transition group-hover:bg-[#043331] group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-black tracking-[-.04em]">{title}</h2>
              <p className="mt-3 min-h-24 text-sm font-semibold leading-6 text-slate-500">{copy}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-teal-800">
                Open system <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[32px] bg-[#043331] p-6 text-white sm:p-7">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Use the intelligence</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Turn distance and island variety into a workable plan.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
              Move from understanding the island’s scale to mapping towns, beaches, heritage, food, fishing, and transportation without underestimating travel time.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/concierge?island=stx" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00]">
                Ask the concierge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/planner?island=stx" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[.16em] text-white">
                Build a trip <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#0b5d5b]/10 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800"><Map className="h-5 w-5" /></span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Map-first intelligence</div>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">See the island’s scale spatially.</h2>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
              Open St. Croix with Christiansted, Frederiksted, the airport, estates, beaches, agriculture, fishing, heritage, and mobility context visible in one workspace.
            </p>
            <Link href="/map?island=stx" className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-full border border-slate-200 px-5 text-[10px] font-black uppercase tracking-[.16em] text-teal-800">
              Open St. Croix map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#0b5d5b]/10 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800"><Sprout className="h-6 w-6" /></span>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Distinctive island strength</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Land-based culture and food systems matter here.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                St. Croix intelligence should connect farms, markets, food producers, historic estates, marine activity, local businesses, and visitor experiences rather than presenting the island only as a beach destination.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
