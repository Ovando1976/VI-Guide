import type { ReactNode } from "react";

import { TravelerPlusOfferTracker } from "@/components/analytics/traveler-plus-offer-tracker";

export default function TravelerPlusLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TravelerPlusOfferTracker />
      {children}
    </>
  );
}
