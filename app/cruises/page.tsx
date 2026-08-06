import type { Metadata } from "next";

import { CruiseInventoryGateway } from "@/components/cruise/cruise-inventory-gateway";
import { CruisePlanningForm } from "@/components/cruise/cruise-planning-form";

export const metadata: Metadata = {
  title: "Cruise Planning",
  description:
    "Search connected cruise inventory when available or request personalized cruise research, cabin guidance, and Caribbean port planning from VI Guide.",
};

export default function CruisesPage() {
  return (
    <>
      <CruiseInventoryGateway />
      <CruisePlanningForm />
    </>
  );
}
