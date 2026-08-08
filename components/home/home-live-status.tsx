import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  ShipWheel,
  Sparkles,
  Waves,
} from "lucide-react";

const STATUS_ITEMS = [
  {
    label: "Local field notes",
    value: "Know the place before you go",
    icon: BookOpenText,
    href: "/community",
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
    tag: "Context",
  },
  {
    label: "Ferry + island journey",
    value: "Plan taxi + ferry as one trip",
    icon: ShipWheel,
    href: "/journey",
    image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg",
    alt: "Red Hook ferry terminal in St. Thomas",
    tag: "Move",
  },
  {
    label: "Beach timing",
    value: "Start early for the calmest water",
    icon: Waves,
    href: "/beaches",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Magens Bay beach in St. Thomas",
    tag: "Water",
  },
  {
    label: "Tours & experiences",
    value: "Book something memorable today",
    icon: CalendarDays,
    href: "/experiences",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline in St. Croix",
    tag: "Explore",
  },
] as const;

export function HomeLiveStatus() {
  return (
    <section className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[32px] border border-[#d9e5e2] bg-[#fffdf8] shadow-[0_28px_80px_rgba(4,51,49,.14)]">
        <div className="flex flex-col gap-4 border-b border-[#dce8e4] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-[#b16a18]">
              <Clock3 size={14} /> Today in the Virgin Islands
            </div>
            <h2 className="vi-display mt-2 max-w-3xl text-2xl font-bold leading-tight tracking-[-.035em] sm:text-3xl">
              Start with the essentials, then shape the day around you.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/events"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#c9dcd7] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#073b39] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0f766e]"
            >
              <CalendarDays size={15} /> See events
            </Link>
            <Link
              href="/today"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#073b39] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white shadow-[0_12px_28px_rgba(3,47,45,.18)] transition hover:-translate-y-0.5 hover:bg-[#0a504c]"
            >
              <Sparkles size={15} /> Build my AI day
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-[#dce8e4] sm:grid-cols-2 xl:grid-cols-4">
          {STATUS_ITEMS.map(({ label, value, icon: Icon, href, image, alt, tag }) => (
            <Link
              key={label}
              href={href}
              className="group relative isolate min-h-[220px] overflow-hidden bg-[#073b39] p-5 text-white sm:min-h-[250px] sm:p-6"
            >
              <Image
                src={image}
                alt={alt}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="-z-30 object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(3,47,45,.12)_0%,rgba(3,47,45,.46)_50%,rgba(2,31,29,.96)_100%)]" />
              <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(115,227,217,.18),transparent_35%)]" />

              <span className="flex h-full min-h-[180px] flex-col justify-between sm:min-h-[202px]">
                <span className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/12 text-[#8ef0e7] shadow-lg backdrop-blur-md transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-white/15 bg-[#032f2d]/48 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.17em] text-white/78 backdrop-blur-md">
                    {tag}
                  </span>
                </span>

                <span>
                  <span className="block text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                    {label}
                  </span>
                  <span className="vi-display mt-2 block text-2xl font-bold leading-[1.02] text-white">
                    {value}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-white/70 transition group-hover:text-[#8ef0e7]">
                    Open in VI Guide <ArrowRight size={13} />
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
