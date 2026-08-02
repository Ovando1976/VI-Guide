"use client";

import { Clock3, Navigation } from "lucide-react";

import type { IntelligencePlanStop } from "@/types/intelligence";

export function ItineraryTimeline({ plan, onSelectStop }: { plan: IntelligencePlanStop[]; onSelectStop(stop: IntelligencePlanStop): void }) {
  return (
    <ol className="rounded-[22px] border border-white/10 bg-white/[.04] px-4 py-3">
      {plan.map((stop, index) => (
        <li key={stop.id} className="relative pl-7">
          {index ? (
            <div className="pb-2 text-[10px] font-bold text-white/35">
              <span className="absolute bottom-0 left-[5px] top-0 w-px bg-gradient-to-b from-cyan-300/40 to-white/10" />
              <span className="inline-flex items-center gap-1.5"><Navigation size={10} /> {travelLabel(stop)}</span>
            </div>
          ) : null}
          <button type="button" onClick={() => onSelectStop(stop)} className="group relative w-full rounded-xl px-2 py-2.5 text-left transition hover:bg-white/[.055]">
            <span className="absolute -left-[25px] top-4 h-3 w-3 rounded-full border-[3px] border-[#09202a] bg-cyan-300 shadow-[0_0_0_2px_rgba(103,232,249,.2)]" />
            <span className="flex items-center justify-between gap-3">
              <strong className="text-sm text-white/90 group-hover:text-cyan-100">{stop.title}</strong>
              {stop.startTime ? <small className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-white/35"><Clock3 size={10} />{stop.startTime}</small> : null}
            </span>
            <span className="mt-0.5 block line-clamp-1 text-[10px] font-medium text-white/40">{stop.summary}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function travelLabel(stop: IntelligencePlanStop) {
  if (!stop.mobility) return stop.durationMinutes ? `${stop.durationMinutes} min` : "Next stop";
  const duration = stop.mobility.estimatedMinutes ? `${stop.mobility.estimatedMinutes} min ` : "";
  return `${duration}${stop.mobility.mode.replaceAll("_", " ")}`;
}
