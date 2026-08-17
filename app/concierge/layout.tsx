import type { ReactNode } from "react";

import { PageEvent } from "@/components/analytics/page-event";

export default function ConciergeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageEvent
        eventName="concierge_started"
        payload={{ surface: "concierge" }}
        context={{ source: "concierge" }}
      />
      {children}
    </>
  );
}
