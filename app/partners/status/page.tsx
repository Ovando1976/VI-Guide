import { PartnerApplicationStatusTracker } from "@/components/partners/partner-application-status";

export const metadata = {
  title: "Partner Application Status | VI Guide",
  description:
    "Privately check the review status of a VI Guide partner application using its reference and contact email.",
};

export default function PartnerApplicationStatusPage() {
  return <PartnerApplicationStatusTracker />;
}
