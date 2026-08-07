import { redirect } from "next/navigation";

import { TravelRequestBoard } from "@/components/admin/travel-request-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "USVI Travel Advisor Desk | VI Guide",
  description:
    "Review and manage traveler trip-planning requests inside VI Guide operations.",
};

export default async function TravelRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/travel-requests");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return <TravelRequestBoard />;
}
