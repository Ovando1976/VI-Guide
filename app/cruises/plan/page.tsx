import type { Metadata } from "next";

import { CruiseHubNav } from "@/components/cruise/cruise-hub-nav";
import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";

export const metadata: Metadata = {
  title: "Cruise Advisor | VI Guide",
  description:
    "Send VI Guide one structured cruise planning brief for sailing research, cabin guidance, budget planning, and Caribbean port-day recommendations.",
};

export default function CruiseAdvisorPage() {
  return (
    <div className="min-h-screen bg-[#f7f2e7] text-[#043331]">
      <CruiseHubNav compact />
      <CruisePlanningForm />
    </div>
  );
}
