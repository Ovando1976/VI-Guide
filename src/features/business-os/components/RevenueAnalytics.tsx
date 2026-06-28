import { BarChart3, Crown, DollarSign, Target, TrendingUp } from "lucide-react";

import type { BusinessOSData } from "../types";
import { label } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

const DEFAULT_LEAD_VALUE = 85;

export default function RevenueAnalytics({ data }: { data: BusinessOSData }) {
  const estimatedRevenue = data.leadStats.won * DEFAULT_LEAD_VALUE;
  const potentialPipeline = data.totals.leadCount * DEFAULT_LEAD_VALUE;
  const revenuePerListing =
    data.businesses.length > 0 ? Math.round(potentialPipeline / data.businesses.length) : 0;
  const revenuePerLead =
    data.totals.leadCount > 0 ? Math.round(potentialPipeline / data.totals.leadCount) : 0;

  const topBusinesses = data.businesses
    .map((business) => {
      const analytics = data.analyticsByBusiness.get(business.id);
      const leads = data.leads.filter((lead) => lead.businessId === business.id);

      return {
        business,
        actions:
          (analytics?.phoneClicks || 0) +
          (analytics?.websiteClicks || 0) +
          (analytics?.directionRequests || 0) +
          leads.length,
        leads: leads.length,
      };
    })
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 5);

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Revenue Analytics"
        text="Estimate business value, pipeline strength, and top-performing listings."
        icon={BarChart3}
      />

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueMetric
          icon={DollarSign}
          label="Estimated Won Revenue"
          value={`$${estimatedRevenue.toLocaleString()}`}
        />
        <RevenueMetric
          icon={TrendingUp}
          label="Potential Pipeline"
          value={`$${potentialPipeline.toLocaleString()}`}
        />
        <RevenueMetric
          icon={Crown}
          label="Revenue / Listing"
          value={`$${revenuePerListing.toLocaleString()}`}
        />
        <RevenueMetric
          icon={Target}
          label="Revenue / Lead"
          value={`$${revenuePerLead.toLocaleString()}`}
        />
      </div>

      <div className="grid gap-5 p-5 pt-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">Top Performing Listings</h3>
              <p className="mt-1 text-sm text-white/55">
                Ranked by calls, website clicks, directions, and leads.
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-cyan-300" />
          </div>

          <div className="mt-5 space-y-3">
            {topBusinesses.length === 0 ? (
              <p className="rounded-2xl bg-white/5 p-4 text-sm font-semibold text-white/55">
                No listing activity yet.
              </p>
            ) : (
              topBusinesses.map((row, index) => (
                <div
                  key={row.business.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.055] p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">
                      #{index + 1} {row.business.name}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                      {label(row.business.category)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black">{row.actions}</p>
                    <p className="text-xs text-white/45">actions</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
            Revenue Model
          </p>

          <h3 className="mt-3 text-3xl font-black">Lead Value Engine</h3>

          <p className="mt-3 text-sm leading-relaxed text-white/70">
            This estimate uses a default value of ${DEFAULT_LEAD_VALUE} per won lead.
            Later we can let each business set its own average booking value.
          </p>

          <div className="mt-5 space-y-3">
            <Insight label="Win Rate" value={`${data.winRate}%`} />
            <Insight label="Won Leads" value={String(data.leadStats.won)} />
            <Insight label="Open Leads" value={String(data.leadStats.new + data.leadStats.contacted)} />
            <Insight label="Premium Listings" value={String(data.featuredCount)} />
          </div>
        </div>
      </div>
    </BusinessOSCard>
  );
}

function RevenueMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4">
      <Icon className="h-5 w-5 text-cyan-300" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/55">{label}</p>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3">
      <span className="text-sm font-semibold text-white/65">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}