import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Island Journey | USVI Explorer",
  description: "Plan connected taxi and ferry journeys across the U.S. Virgin Islands with USVI Explorer.",
};

export default function IslandJourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
