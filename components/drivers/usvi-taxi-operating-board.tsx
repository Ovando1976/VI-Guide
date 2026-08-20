import {
  Anchor,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  CarTaxiFront,
  CircleParking,
  Clock3,
  Luggage,
  MapPinned,
  Plane,
  Ship,
  Users,
} from "lucide-react";

const OPERATING_MODES = [
  {
    icon: CircleParking,
    title: "Taxi stand / queue",
    detail: "Work the authorized stand or association queue without treating the next ride like surge-priced rideshare demand.",
  },
  {
    icon: Plane,
    title: "Airport pickup",
    detail: "Keep terminal, passenger count, luggage, flight timing, and exact governed tariff endpoint visible before departure.",
  },
  {
    icon: Ship,
    title: "Cruise / harbor",
    detail: "Prioritize ship timing, WICO vs. Crown Bay context, group size, luggage, and return-to-ship deadlines.",
  },
  {
    icon: Anchor,
    title: "Ferry connection",
    detail: "Protect Red Hook, Cruz Bay, and other ferry handoffs with connection deadlines and terminal-specific destination context.",
  },
  {
    icon: Users,
    title: "Shared / group taxi",
    detail: "Show party size and published per-passenger tiers clearly so the driver never has to reconstruct the tariff mentally.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Hotel / private request",
    detail: "Use the rider's exact hotel, estate, villa, landmark, pickup note, and verified route rather than assuming a street address.",
  },
] as const;

export function UsviTaxiOperatingBoard() {
  return (
    <section className="mt-6 overflow-hidden rounded-[30px] border border-[#043331]/10 bg-white shadow-[0_18px_48px_rgba(4,51,49,.08)]">
      <div className="bg-[linear-gradient(135deg,#043331,#0b6b64)] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              USVI taxi operating model
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
              Run the taxi business the way the islands actually work.
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/70">
              Stand work, airport and cruise arrivals, ferry connections, estate and landmark pickups, group fares, luggage, and regulated pricing belong in the driver's primary workflow.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">
            <BadgeDollarSign className="h-4 w-4" /> Governed tariff only
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OPERATING_MODES.map(({ icon: Icon, title, detail }) => (
            <article key={title} className="rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-black text-[#043331]">{title}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
            </article>
          ))}
        </div>

        <aside className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-amber-800">
            <CarTaxiFront className="h-4 w-4" /> Before moving the taxi
          </div>
          <div className="mt-4 space-y-3 text-sm font-bold text-[#4c3b13]">
            <DriverRule icon={MapPinned} text="Confirm the exact pickup and destination identity, including subarea or terminal when the tariff distinguishes it." />
            <DriverRule icon={Users} text="Confirm the passenger count before relying on the published passenger tier." />
            <DriverRule icon={Luggage} text="Confirm standard luggage count; unsupported special charges stay outside the automatic fare." />
            <DriverRule icon={Clock3} text="Protect flight, ferry, cruise, and appointment deadlines without promising an impossible arrival time." />
            <DriverRule icon={Building2} text="Use estates, hotels, beaches, terminals, and landmarks as first-class pickup context—not street addresses alone." />
          </div>
          <div className="mt-5 rounded-[18px] border border-rose-200 bg-white p-4 text-xs font-black leading-5 text-rose-800">
            If the system cannot resolve a governed fare, the console must show “fare requires clarification.” Do not substitute an estimate and do not guess between financially distinct tariff areas.
          </div>
        </aside>
      </div>
    </section>
  );
}

function DriverRule({ icon: Icon, text }: { icon: typeof MapPinned; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-amber-800 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <span className="leading-5">{text}</span>
    </div>
  );
}
