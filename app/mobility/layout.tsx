import type { ReactNode } from "react";

import { MobilitySearchGate } from "@/components/mobility-search-gate";

export default function MobilityLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MobilitySearchGate />
      {children}
    </>
  );
}
