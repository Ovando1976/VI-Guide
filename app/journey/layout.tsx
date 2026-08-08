import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Island Journey | VI Guide",
  description: "Plan connected taxi and ferry journeys across the U.S. Virgin Islands with VI Guide.",
};

export default function IslandJourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
