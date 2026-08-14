import type { Metadata } from "next";
import { ShipWheel } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";

export const metadata: Metadata = {
  title: "Cruise Advisor | USVI Explorer",
  description:
    "Send USVI Explorer one structured cruise planning brief for sailing research, cabin guidance, budget planning, and Caribbean port-day recommendations.",
};

export default function CruiseAdvisorPage() {
  return (
    <div className="min-h-screen bg-[#f7f2e7] text-[#043331]">
      <section className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/cruises"
          actionLabel="Cruise Hub"
          actionIcon={ShipWheel}
          secondaryHref="/trips"
          secondaryLabel="My Trip"
        />
      </section>
      <div className="mt-5">
        <CruiseHubNav compact />
      </div>
      <CruisePlanningForm />
    </div>
  );
}
