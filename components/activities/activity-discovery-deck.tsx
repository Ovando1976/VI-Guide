import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Waves, Sailboat, ShipWheel, Footprints, Mountain, Sparkles } from "lucide-react";

const PICKS = [
  {
    title: "Scuba & underwater",
    kicker: "Reefs · two-tank dives · SNUBA",
    description: "Go below the surface with certified dive trips, beginner-friendly underwater experiences, and reef exploration across the islands.",
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
    href: "/activities?category=scuba#activity-search-title",
    icon: Waves,
    featured: true,
  },
  {
    title: "Sailing & private charters",
    kicker: "Catamarans · powerboats · sunset",
    description: "Compare sails and private boats for beach-hopping, snorkeling, sunset, and custom island days.",
    image: "/images/usvi-harbor-hero.jpg",
    href: "/activities?category=sailing#activity-search-title",
    icon: Sailboat,
  },
  {
    title: "Buck Island & snorkel",
    kicker: "St. Croix · reef trail · Turtle Beach",
    description: "Start with verified Buck Island experiences and authorized-operator context for one of St. Croix's signature days.",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    href: "/activities?island=stx&category=snorkeling#activity-search-title",
    icon: ShipWheel,
  },
  {
    title: "Kayak & watersports",
    kicker: "Mangroves · cays · paddling",
    description: "Find guided kayak, paddle, parasail, jet-ski, and other water-focused adventures matched to your island.",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    href: "/activities?category=kayak#activity-search-title",
    icon: Footprints,
  },
  {
    title: "Land adventures",
    kicker: "Zipline · hiking · culture",
    description: "Balance beach days with mountain views, trails, heritage, food, wildlife, and other on-island experiences.",
    image: "/images/usvi-harbor-hero.jpg",
    href: "/activities?category=zipline#activity-search-title",
    icon: Mountain,
  },
] as const;

export function ActivityDiscoveryDeck() {
  return (
    <section className="bg-[#f5f0e6] px-4 py-10 sm:px-7 lg:px-10 lg:py-14" aria-labelledby="activity-discovery-title">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="vi-eyebrow text-[#9b5d12]">Choose the kind of day</p>
            <h2 id="activity-discovery-title" className="vi-display mt-3 max-w-3xl text-4xl font-bold leading-[.95] sm:text-6xl">Start with what you want to feel.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-600">Jump straight into the USVI experiences travelers ask for most, then refine by island, operator, and trip fit.</p>
          </div>
          <Link href="/concierge?open=true&prompt=Help%20me%20choose%20the%20best%20USVI%20activities%20for%20my%20trip" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#032f2d] px-6 text-[10px] font-black uppercase tracking-[.15em] text-white">Build my activity day <Sparkles size={15} className="text-[#73e3d9]" /></Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-12">
          {PICKS.map((pick, index) => {
            const Icon = pick.icon;
            const wide = index === 0 || index === 1;
            return (
              <Link key={pick.title} href={pick.href} className={`group relative isolate min-h-[310px] overflow-hidden rounded-[30px] bg-[#032f2d] text-white shadow-[0_18px_55px_rgba(3,47,45,.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(3,47,45,.18)] ${wide ? "lg:col-span-6" : "lg:col-span-4"}`}>
                <Image src={pick.image} alt="Representative USVI island scenery" fill sizes="(max-width: 1024px) 100vw, 50vw" className="-z-20 object-cover transition duration-700 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,31,29,.08),rgba(2,31,29,.88)_74%,rgba(2,31,29,.98))]" />
                <div className="flex h-full min-h-[310px] flex-col justify-between p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-[#032f2d]/65 backdrop-blur-xl"><Icon size={22} className="text-[#f5c451]" /></span>
                    <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-white/80 backdrop-blur-xl">Representative imagery</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">{pick.kicker}</p>
                    <h3 className="vi-display mt-2 text-3xl font-bold sm:text-4xl">{pick.title}</h3>
                    <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/72">{pick.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#73e3d9]">Explore this category <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
