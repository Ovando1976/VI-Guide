import { Building2 } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { PartnerApplicationStatusTracker } from "@/components/partners/partner-application-status";

export const metadata = {
  title: "Partner Application Status | VI Guide",
  description:
    "Privately check the review status of a VI Guide partner application using its reference and contact email.",
};

export default function PartnerApplicationStatusPage() {
  return (
    <>
      <div className="bg-[#032f2d] px-4 pt-5 sm:px-7 lg:px-10">
        <ViPublicHeader
          actionHref="/partners/apply"
          actionLabel="Apply to partner"
          actionIcon={Building2}
          secondaryHref="/partners"
          secondaryLabel="Partner network"
        />
      </div>
      <PartnerApplicationStatusTracker />
    </>
  );
}
