import type { Metadata } from "next";
import { ShipWheel } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";
import { CruisePortDaySafetyPlanner } from "@/components/cruise/cruise-port-day-safety-planner";

export const metadata: Metadata = {
  title: "Cruise Advisor | USVI Explorer",
  description:
    "Plan a cruise and check a USVI port-day return-to-ship buffer before you commit to an itinerary.",
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
      <CruisePortDaySafetyPlanner />
      <CruisePlanningForm />
    </div>
  );
}
