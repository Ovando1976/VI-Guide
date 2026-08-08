import type { ReactNode } from "react";
import { Map } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export default function HeritageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-[#032d2c] px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/map?filter=history"
          actionLabel="Heritage map"
          actionIcon={Map}
          secondaryHref="/concierge?context=heritage"
          secondaryLabel="Ask Heritage Guide"
        />
      </div>
      {children}
    </>
  );
}
