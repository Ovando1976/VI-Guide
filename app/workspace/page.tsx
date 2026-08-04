import { SyncedTravelerWorkspace } from "@/components/traveler/synced-traveler-workspace";

export const metadata = {
  title: "Traveler Workspace | VI Guide",
  description:
    "Manage your active mission, itinerary, map, reservations, and VI Concierge from one connected workspace.",
};

export default function TravelerWorkspacePage() {
  return <SyncedTravelerWorkspace />;
}
