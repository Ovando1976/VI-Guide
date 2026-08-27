import type { ReactNode } from "react";

import { TravelerJourneyDock } from "@/components/trips/traveler-journey-dock";

export default function TripsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <TravelerJourneyDock />
    </>
  );
}
