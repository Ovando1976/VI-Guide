import { Building2, Crown, ExternalLink, MapPin, ShieldCheck } from "lucide-react";

import type { BusinessOSData } from "../types";
import { label } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

export default function BusinessListingsPanel({
  data,
  isAdmin,
}: {
  data: BusinessOSData;
  isAdmin: boolean;
}) {
  return (
    <BusinessOSCard>
      <SectionHeader
        title="Business Listings"
        text={isAdmin ? "All Firestore business listings." : "Businesses claimed by this account."}
        icon={Building2}
      />

      {data.businesses.length === 0 ? (
        <div className="p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-cyan-300" />
          <h3 className="mt-4 text-2xl font-black">No businesses yet</h3>
          <p className="mt-2 text-sm text-white/60">
            Claim a listing to manage leads, analytics, upgrades, and customer activity.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {data.businesses.map((business) => {
            const row = data.analyticsByBusiness.get(business.id);
            const businessLeads = data.leads.filter(
              (lead) => lead.businessId === business.id,
            );

            return (
              <div
                key={business.id}
                className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black">{business.name}</h3>

                    <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-200">
                      {label(business.category)}
                    </span>

                    {business.claimStatus === "claimed" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                        <ShieldCheck className="h-3 w-3" />
                        Claimed
                      </span>
                    ) : null}

                    {business.featured || business.premium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                        <Crown className="h-3 w-3" />
                        {business.premium ? "Premium" : "Featured"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {business.description}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/65">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    {label(business.estate || business.address || business.island)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <MiniMetric label="Views" value={row?.profileViews || 0} />
                  <MiniMetric label="Leads" value={businessLeads.length || row?.leadCount || 0} />
                  <MiniMetric label="Calls" value={row?.phoneClicks || 0} />
                  <MiniMetric label="Directions" value={row?.directionRequests || 0} />
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <a
                    href={`/businesses/${business.slug || business.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    View
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  {!business.premium ? (
                    <a
                      href={`/business-signup?business=${business.slug || business.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-300 px-4 py-3 text-sm font-black text-slate-950"
                    >
                      Upgrade
                      <Crown className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BusinessOSCard>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-3">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-xs font-bold text-white/45">{label}</p>
    </div>
  );
}