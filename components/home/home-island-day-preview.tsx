"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, MapPinned, Route, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

import {
  ACTIVE_ISLAND_UPDATED_EVENT,
  readActiveIsland,
  writeActiveIsland,
  type ActiveIsland,
} from "@/lib/active-island";

const ISLAND_PREVIEWS = {
  stt: {
    code: "STT",
    name: "St. Thomas",
    title: "Harbor energy, beach time, and an easy route between both.",
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
    start: "Morning",
    pace: "City + coast",
  },
  stj: {
    code: "STJ",
    name: "St. John",
    title: "National park coastlines and a ferry-smart island day.",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay and the green hills of St. John",
    start: "Early",
    pace: "Park + water",
  },
  stx: {
    code: "STX",
    name: "St. Croix",
    title: "Historic towns, local food, and room to explore deeper.",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline and green hills on St. Croix",
    start: "Flexible",
    pace: "Culture + coast",
  },
} as const satisfies Record<
  ActiveIsland,
  {
    code: string;
    name: string;
    title: string;
    image: string;
    alt: string;
    start: string;
    pace: string;
  }
>;

export function HomeIslandDayPreview() {
  const [island, setIsland] = useState<ActiveIsland>("stt");

  useEffect(() => {
    setIsland(readActiveIsland());

    function syncIsland(event: Event) {
      const nextIsland = (event as CustomEvent<ActiveIsland>).detail;
      if (nextIsland) setIsland(nextIsland);
    }

    function syncStoredIsland() {
      setIsland(readActiveIsland());
    }

    window.addEventListener(ACTIVE_ISLAND_UPDATED_EVENT, syncIsland);
    window.addEventListener("storage", syncStoredIsland);
    return () => {
      window.removeEventListener(ACTIVE_ISLAND_UPDATED_EVENT, syncIsland);
      window.removeEventListener("storage", syncStoredIsland);
    };
  }, []);

  const preview = ISLAND_PREVIEWS[island];

  function selectIsland(nextIsland: ActiveIsland) {
    setIsland(nextIsland);
    writeActiveIsland(nextIsland);
  }

  return (
    <aside className="usvi-command-card vi-glass overflow-hidden rounded-[38px] p-3 sm:p-4">
      <div className="relative min-h-[540px] overflow-hidden rounded-[30px] bg-[#062f31]">
        <Image
          key={preview.image}
          src={preview.image}
          alt={preview.alt}
          fill
          sizes="(min-width: 1024px) 44vw, 100vw"
          className="object-cover transition duration-700"
        />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,29,.10)_0%,rgba(3,31,29,.28)_38%,rgba(2,25,25,.97)_100%)]" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 sm:p-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-[#032f2d]/60 px-3 py-2 text-[8px] font-black uppercase tracking-[.17em] text-white backdrop-blur-xl">
            <Compass size={13} className="text-[#73e3d9]" aria-hidden="true" />
            Island day preview
          </span>
          <div className="flex gap-1.5 rounded-full border border-white/18 bg-[#032f2d]/60 p-1.5 backdrop-blur-xl" aria-label="Preview an island">
            {(Object.keys(ISLAND_PREVIEWS) as ActiveIsland[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => selectIsland(code)}
                aria-label={`Preview ${ISLAND_PREVIEWS[code].name}`}
                aria-pressed={island === code}
                className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-[8px] font-black uppercase tracking-[.12em] transition ${
                  island === code
                    ? "bg-[#f5c451] text-[#032f2d]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {ISLAND_PREVIEWS[code].code}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="vi-eyebrow text-[#f5c451]">Selected · {preview.name}</div>
              <h2 className="vi-display mt-2 text-4xl font-bold leading-[.92] text-white sm:text-5xl">
                {preview.title}
              </h2>
            </div>
            <MapPinned className="hidden shrink-0 text-[#73e3d9] sm:block" size={30} aria-hidden="true" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <PreviewFact icon={SunMedium} value={preview.start} label="Start window" />
            <PreviewFact icon={Compass} value={preview.pace} label="Day shape" />
            <PreviewFact icon={Route} value="4 parts" label="Suggested flow" accent />
          </div>

          <Link
            href={`/today?island=${island}`}
            className="mt-3 flex min-h-12 items-center justify-between rounded-[20px] bg-[#f5c451] px-5 py-4 text-[9px] font-black uppercase tracking-[.15em] text-[#032f2d] transition hover:bg-[#ffdc76]"
          >
            <span>Build my {preview.name} day</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="mt-3 text-[9px] font-semibold leading-4 text-white/45">
            Planning preview—not live weather, water, or operating-status data. Confirm conditions before departure.
          </p>
        </div>
      </div>
    </aside>
  );
}

function PreviewFact({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: typeof Compass;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/[.09] p-3 backdrop-blur-xl">
      <Icon size={15} className={accent ? "text-[#f5c451]" : "text-[#73e3d9]"} aria-hidden="true" />
      <span className="mt-3 block text-sm font-black leading-tight text-white sm:text-base">{value}</span>
      <span className="mt-1 block text-[7px] font-bold uppercase tracking-[.1em] text-white/45 sm:text-[8px]">{label}</span>
    </div>
  );
}
