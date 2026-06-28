import { Lightbulb, Sparkles } from "lucide-react";

import type { BusinessOSData } from "../types";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function AIBusinessCoach({ data }: { data: BusinessOSData }) {
  const tips = [
    data.leadStats.new > 0
      ? `Reply to ${data.leadStats.new} new lead${data.leadStats.new === 1 ? "" : "s"} today. Fast replies improve close rate.`
      : "No new leads are waiting right now.",
    data.winRate < 25
      ? "Your win rate is low. Add stronger follow-up messages and mark leads as won/lost consistently."
      : `Your win rate is ${data.winRate}%. Keep tracking every lead source.`,
    data.featuredCount === 0 && data.businesses.length > 0
      ? "Start selling featured listings. This should become an early recurring revenue stream."
      : "Featured listings are active. Track whether they produce more actions.",
    `Projected monthly revenue is $${data.forecast.projectedMonthlyRevenue.toLocaleString()}.`,
  ];

  return (
    <BusinessOSCard>
      <SectionHeader
        title="AI Business Coach"
        text="Practical next moves based on leads, revenue, and customer actions."
        icon={Sparkles}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {tips.map((tip) => (
          <div
            key={tip}
            className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5"
          >
            <Lightbulb className="h-5 w-5 text-cyan-300" />
            <p className="mt-3 text-sm leading-relaxed text-white/70">{tip}</p>
          </div>
        ))}
      </div>
    </BusinessOSCard>
  );
}