import Link from "next/link";
import {
  Anchor,
  ArrowRight,
  Compass,
  MapPinned,
  Sailboat,
  Sparkles,
  Waves,
} from "lucide-react";

const QUICK_LINKS = [
  {
    href: "/activities?category=scuba#scuba",
    label: "Scuba diving",
    detail: "Reefs, wrecks & instruction",
    icon: Waves,
  },
  {
    href: "/activities?category=sailing#sailing-charters",
    label: "Sailing",
    detail: "Sunset sails & catamarans",
    icon: Sailboat,
  },
  {
    href: "/activities?category=boat-charter#sailing-charters",
    label: "Private charters",
    detail: "Custom island-hopping days",
    icon: Anchor,
  },
  {
    href: "/activities?island=stt#activity-search-title",
    label: "St. Thomas",
    detail: "Harbor, water & adventure",
    icon: MapPinned,
  },
  {
    href: "/activities?island=stj#activity-search-title",
    label: "St. John",
    detail: "National Park & North Shore",
    icon: Compass,
  },
  {
    href: "/activities?island=stx#activity-search-title",
    label: "St. Croix",
    detail: "Buck Island, dives & culture",
    icon: MapPinned,
  },
];

export function ActivityQuickLaunch() {
  return (
    <section className="border-b border-[#d8e4e0] bg-[#fffdf8] px-4 py-4 text-[#032f2d] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#0f766e]">
              Start with what you want to do
            </p>
            <h2 className="mt-1 text-lg font-black tracking-[-.02em] sm:text-xl">
              Jump straight into the best-fit island experience.
            </h2>
          </div>
          <Link
            href="/concierge?prompt=Build%20me%20an%20activity%20day%20in%20the%20USVI%20with%20transportation%2C%20timing%2C%20and%20a%20backup%20plan"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#032f2d] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#075e58]"
          >
            <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Build my day
            <ArrowRight className="h-4 w-4 text-[#f5c451]" />
          </Link>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_LINKS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group min-w-[190px] flex-1 rounded-[22px] border border-[#d9e6e2] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(4,51,49,.06)] transition hover:-translate-y-0.5 hover:border-[#aad7d0] hover:shadow-[0_14px_30px_rgba(4,51,49,.1)]"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf8f5] text-[#0f766e] transition group-hover:bg-[#d9f2ed]">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block text-sm font-black">{label}</strong>
                  <span className="mt-1 block text-[10px] font-semibold leading-4 text-[#657875]">
                    {detail}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
