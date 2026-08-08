import type { ReactNode } from "react";
import { Map } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export default function IntelligenceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-[#f8f4ea] px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/map"
          actionLabel="Open Living Map"
          actionIcon={Map}
          secondaryHref="/concierge?prompt=Help%20me%20understand%20the%20Virgin%20Islands%20and%20turn%20that%20context%20into%20a%20practical%20trip"
          secondaryLabel="Ask VI Concierge"
        />
      </div>
      {children}
    </>
  );
}
