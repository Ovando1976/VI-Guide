import { TrendingUp } from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function LeadSourceRevenue({ data }: { data: BusinessOSData }) {
  return (
    <BusinessOSCard>
      <SectionHeader
        title="Lead Source Revenue"
        text="See which VI Guide channels are creating customer opportunities."
        icon={TrendingUp}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.sourceStats.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 text-sm text-white/60">
            No lead source data yet.
          </div>
        ) : (
          data.sourceStats.map((source) => (
            <div
              key={source.source}
              className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-3xl font-black">{source.count}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/55">
                    {source.label}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-200">
                  {source.percentage}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{
                    width: `${Math.max(source.percentage, source.count > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </BusinessOSCard>
  );
}