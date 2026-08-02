import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Landmark,
  Leaf,
  Map,
  Navigation,
  Ship,
  Waves,
} from "lucide-react";

const SYSTEMS = [
  {
    title: "Arrival intelligence",
    copy: "Connect Cruz Bay ferry arrivals, passenger flow, baggage, taxis, villas, lodging, and onward movement into one arrival picture.",
    href: "/map?island=stj",
    icon: Ship,
  },
  {
    title: "Mobility intelligence",
    copy: "Plan licensed rides from Cruz Bay toward North Shore beaches, villas, trail access, Coral Bay, and return ferry connections.",
    href: "/mobility?island=stj",
    icon: Navigation,
  },
  {
    title: "Protected-land intelligence",
    copy: "Understand how park lands, trails, coastal access, visitor capacity, conservation, and transportation shape the island experience.",
    href: "/map?island=stj",
    icon: Leaf,
  },
  {
    title: "Beach intelligence",
    copy: "Explore North Shore beaches through public access, parking limits, taxi planning, nearby trails, and practical timing.",
    href: "/beaches?island=stj",
    icon: Waves,
  },
  {
    title: "Heritage intelligence",
    copy: "Connect plantation-era sites, cultural landscapes, historic estates, archives, and the living communities of Cruz Bay and Coral Bay.",
    href: "/heritage?island=stj",
    icon: Landmark,
  },
  {
    title: "Village intelligence",
    copy: "See how Cruz Bay services, Coral Bay businesses, accommodations, dining, marine access, and island mobility work together.",
    href: "/places?island=stj",
    icon: Compass,
  },
] as const;

export default function StJohnIntelligencePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.16),transparent_32%),linear-gradient(180deg,#f8f4ea_0%,#fff_52%,#f3f7f5_100%)] px-4 py-6 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,#032d2b_0%,#075b57_50%,#18a99e_100%)] px-6 py-9 text-white shadow-[0_28px_90px_rgba(4,51,49,.22)] sm:px-8 lg:px-10 lg:py-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                <Compass className="h-4 w-4" /> St. John intelligence
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl lg:text-6xl">
                Read the island through arrival, access, and protected landscape.
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                St. John intelligence connects ferry arrivals, Cruz Bay, North Shore beaches, villas, trails, protected lands, Coral Bay, heritage, and licensed mobility into one practical island view.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/[.08] p-5 backdrop-blur">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f7d778]">
                Primary operating spine
              </div>
              <div className="mt-3 text-2xl font-black tracking-[-.04em]">
                Cruz Bay → North Shore → Coral Bay
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                Ferry timing, limited road capacity, beach demand, villa access, and protected landscapes shape nearly every visitor movement decision.
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
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Turn ferry timing and island access into a workable day.</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
              Move from understanding arrival constraints to mapping beaches, building a trip, arranging transportation, and protecting enough time for the return ferry.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/concierge?island=stj" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00]">
                Ask the concierge <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/planner?island=stj" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[.16em] text-white">
                Build a trip <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#0b5d5b]/10 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800"><Map className="h-5 w-5" /></span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">Map-first intelligence</div>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">See access constraints spatially.</h2>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
              Open St. John with ferry arrival, Cruz Bay, North Shore beaches, trails, estates, Coral Bay, heritage, and mobility context visible in one workspace.
            </p>
            <Link href="/map?island=stj" className="mt-5 inline-flex min-h-12 w-full items-center justify-between rounded-full border border-slate-200 px-5 text-[10px] font-black uppercase tracking-[.16em] text-teal-800">
              Open St. John map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
