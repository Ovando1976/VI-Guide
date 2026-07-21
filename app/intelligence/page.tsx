import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Fish,
  Landmark,
  Map,
  Search,
  Ship,
  Sparkles,
  Waves,
} from "lucide-react";

const MODULES = [
  {
    title: "Territory map",
    copy: "Explore estates, places, routes, beaches, and island geography in one operational map.",
    href: "/map",
    icon: Map,
    label: "Open map intelligence",
  },
  {
    title: "Heritage intelligence",
    copy: "Connect historic places, governors, archives, and territorial context to the places visitors see today.",
    href: "/heritage",
    icon: Landmark,
    label: "Explore heritage",
  },
  {
    title: "Beach intelligence",
    copy: "Discover beaches through island context, nearby places, mobility access, and public-use planning.",
    href: "/beaches",
    icon: Waves,
    label: "Explore beaches",
  },
  {
    title: "Fishing intelligence",
    copy: "Use handbook-informed species, conservation, safety, and location knowledge for responsible fishing.",
    href: "/fishing",
    icon: Fish,
    label: "Open fishing guide",
  },
  {
    title: "Territory search",
    copy: "Search across the connected VI Guide place, travel, heritage, and geographic knowledge system.",
    href: "/search",
    icon: Search,
    label: "Search the territory",
  },
  {
    title: "Ask the concierge",
    copy: "Turn island knowledge into practical recommendations, connected plans, bookings, and transportation.",
    href: "/concierge",
    icon: Sparkles,
    label: "Ask VI Guide",
  },
] as const;

const ISLANDS = [
  {
    code: "stt",
    name: "St. Thomas",
    focus: "Urban harbor, cruise, airport, shopping, beaches, and east–west mobility corridors.",
    route: "Airport → Charlotte Amalie → Red Hook",
  },
  {
    code: "stj",
    name: "St. John",
    focus: "Cruz Bay arrival, North Shore beaches, protected landscapes, villas, and ferry-dependent movement.",
    route: "Cruz Bay → North Shore → Coral Bay",
  },
  {
    code: "stx",
    name: "St. Croix",
    focus: "Twin towns, heritage districts, beaches, agriculture, fishing, and longer cross-island routes.",
    route: "Airport → Christiansted → Frederiksted",
  },
] as const;

export default function IntelligencePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.16),transparent_32%),linear-gradient(180deg,#f8f4ea_0%,#fff_52%,#f3f7f5_100%)] px-4 py-6 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,#032d2b_0%,#075b57_50%,#18a99e_100%)] px-6 py-9 text-white shadow-[0_28px_90px_rgba(4,51,49,.22)] sm:px-8 lg:px-10 lg:py-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#f5c451]/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                <Compass className="h-4 w-4" /> Milestone 6 · Island Intelligence
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl lg:text-6xl">
                Understand the islands. Then act on what you know.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                VI Guide connects geography, heritage, beaches, fishing, mobility, search, and concierge guidance into one practical territorial intelligence system.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 backdrop-blur">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f7d778]">
                Connected intelligence
              </div>
              <div className="mt-3 text-2xl font-black tracking-[-.04em]">
                One place becomes many useful answers.
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                Find a place, understand its context, plan the visit, book what you need, and move through the territory with confidence.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-teal-700">
                Island briefs
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
                Start with the operating character of each island
              </h2>
            </div>
            <Link
              href="/concierge"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-lg"
            >
              Ask an island question <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {ISLANDS.map((island) => (
              <article
                key={island.code}
                className="overflow-hidden rounded-[30px] border border-[#0b5d5b]/10 bg-white shadow-sm"
              >
                <div className="bg-[#043331] p-5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                      Island intelligence
                    </div>
                    <Ship className="h-5 w-5 text-white/60" />
                  </div>
                  <h3 className="mt-3 text-3xl font-black tracking-[-.045em]">
                    {island.name}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                    {island.focus}
                  </p>
                </div>
                <div className="p-5">
                  <div className="rounded-[22px] bg-[#f8f4ea] p-4">
                    <div className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">
                      Primary movement spine
                    </div>
                    <div className="mt-2 text-sm font-black text-[#043331]">
                      {island.route}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <Link
                      href={`/map?island=${island.code}`}
                      className="inline-flex min-h-11 items-center justify-between rounded-full border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] text-teal-800 transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      Open island map <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/mobility?island=${island.code}`}
                      className="inline-flex min-h-11 items-center justify-between rounded-full border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] text-teal-800 transition hover:border-teal-300 hover:bg-teal-50"
                    >
                      Plan island ride <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-teal-700">
              Intelligence modules
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl">
              Explore the territory through connected systems
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MODULES.map(({ title, copy, href, icon: Icon, label }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-[30px] border border-[#0b5d5b]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(4,51,49,.12)] sm:p-6"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800 transition group-hover:bg-[#043331] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-[-.04em]">
                  {title}
                </h3>
                <p className="mt-3 min-h-20 text-sm font-semibold leading-6 text-slate-500">
                  {copy}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-teal-800">
                  {label} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
