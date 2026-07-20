"use client";

import Link from "next/link";
import { BedDouble, Landmark, MapPin, Palmtree, Waves } from "lucide-react";

import type { ConciergeEvidenceItem } from "@/lib/concierge-client";

export function ConciergeEvidenceCards({
  evidence,
  maxItems = 4,
}: {
  evidence: ConciergeEvidenceItem[];
  maxItems?: number;
}) {
  const visible = evidence.slice(0, Math.max(1, Math.min(maxItems, 6)));
  if (!visible.length) return null;

  return (
    <section className="space-y-2 pl-9" aria-label="Grounded destination matches">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/30">
          Grounded matches
        </span>
        <span className="text-[9px] font-bold text-cyan-200/50">
          Live VI Guide catalog
        </span>
      </div>

      <div className="grid gap-2">
        {visible.map((item) => {
          const Icon = iconForType(item.type);
          return (
            <Link
              key={`${item.type}:${item.href}`}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.075]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                <Icon size={16} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="truncate text-xs font-extrabold text-white/90">
                    {item.name}
                  </strong>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-white/40">
                    {labelForType(item.type)}
                  </span>
                </span>

                <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-white/42">
                  {item.description}
                </span>

                <span className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200/55">
                  <MapPin size={10} /> {formatIsland(item.island)}
                  <span className="ml-auto transition group-hover:translate-x-0.5">Open →</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function iconForType(type: ConciergeEvidenceItem["type"]) {
  if (type === "beach") return Waves;
  if (type === "stay") return BedDouble;
  if (type === "historic") return Landmark;
  return Palmtree;
}

function labelForType(type: ConciergeEvidenceItem["type"]) {
  if (type === "historic") return "Heritage";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatIsland(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "stt") return "St. Thomas";
  if (normalized === "stj") return "St. John";
  if (normalized === "stx") return "St. Croix";
  return value;
}
