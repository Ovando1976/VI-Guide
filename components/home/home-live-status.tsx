import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  ShipWheel,
  Sparkles,
  SunMedium,
  Waves,
} from "lucide-react";

const STATUS_ITEMS = [
  {
    label: "Island outlook",
    value: "Warm, breezy, and ready to explore",
    icon: SunMedium,
    href: "/today",
  },
  {
    label: "Ferry planning",
    value: "Check routes before you go",
    icon: ShipWheel,
    href: "/mobility",
  },
  {
    label: "Beach timing",
    value: "Start early for the calmest water",
    icon: Waves,
    href: "/beaches",
  },
  {
    label: "Happening today",
    value: "Build a day around local events",
    icon: CalendarDays,
    href: "/events",
  },
] as const;

export function HomeLiveStatus() {
  return (
    <section className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[30px] border border-[#d9e5e2] bg-white/96 shadow-[0_28px_80px_rgba(4,51,49,.14)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-[#dce8e4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-[#b16a18]">
              <Clock3 size={14} /> Today in the Virgin Islands
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
              Start with the essentials, then shape the day around you.
            </h2>
          </div>
          <Link
            href="/today"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#073b39] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
          >
            <Sparkles size={15} /> Build my AI day
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_ITEMS.map(({ label, value, icon: Icon, href }, index) => (
            <Link
              key={label}
              href={href}
              className={`group flex min-h-[142px] gap-4 p-5 transition hover:bg-[#f7fbf9] sm:p-6 ${
                index ? "border-t border-[#e1ebe8] sm:border-l" : ""
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f5f1] text-[#0f766e] transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[9px] font-black uppercase tracking-[.17em] text-[#9a5a17]">
                  {label}
                </span>
                <span className="mt-2 block text-sm font-bold leading-6 text-[#173f3c]">
                  {value}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
