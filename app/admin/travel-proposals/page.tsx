import { redirect } from "next/navigation";

import { TravelProposalBoard } from "@/components/admin/travel-proposal-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Travel Advisor Proposals | VI Guide",
  description:
    "Publish and send privacy-safe VI Guide itinerary proposals from the travel advisor workflow.",
};

export default async function TravelProposalsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/travel-proposals");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return <TravelProposalBoard />;
}
