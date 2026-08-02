import { GovernorTimelineExplorer } from "@/components/heritage/governor-timeline-explorer";

export const metadata = {
  title: "Governors of the Virgin Islands | VI Guide",
  description:
    "Explore recorded Virgin Islands governors and administrations from early Danish company rule through British occupations, Danish Crown government, U.S. naval and appointed government, and the elected era.",
};

export default function GovernorsPage() {
  return <GovernorTimelineExplorer />;
}
