import type { Metadata } from "next";

import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";

export const metadata: Metadata = {
  title: "Cruise Planning",
  description:
    "Request personalized cruise research, cabin guidance, pricing comparisons, and Caribbean port planning from VI Guide.",
};

export default function CruisesPage() {
  return <CruisePlanningForm />;
}
