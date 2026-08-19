import type { ReactNode } from "react";

import { PageEvent } from "@/components/analytics/page-event";

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageEvent eventName="landing_view" payload={{ surface: "explore" }} context={{ source: "explore" }} />
      {children}
    </>
  );
}
