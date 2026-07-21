import { GovernorTimelineExplorer } from "@/components/heritage/governor-timeline-explorer";

export const metadata = {
  title: "Governors of the U.S. Virgin Islands | VI Guide",
  description:
    "Explore every U.S.-period governor of the Virgin Islands, from naval administration through appointed and elected government.",
};

export default function GovernorsPage() {
  return <GovernorTimelineExplorer />;
}
