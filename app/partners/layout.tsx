import { Building2 } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f2e7] text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/partners/apply"
          actionLabel="Apply to partner"
          actionIcon={Building2}
          secondaryHref="/partners/status"
          secondaryLabel="Check status"
        />
      </div>
      {children}
    </div>
  );
}
