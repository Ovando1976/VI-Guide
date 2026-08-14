import { redirect } from "next/navigation";

import { TravelAdvisorRevenueOverview } from "@/components/admin/travel-advisor-revenue-overview";
import { TravelRequestBoard } from "@/components/admin/travel-request-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "USVI Travel Advisor Desk | USVI Explorer",
  description:
    "Review and manage traveler trip-planning requests, booking conversion, payment progress, and recorded revenue inside USVI Explorer operations.",
};

export default async function TravelRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/travel-requests");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="bg-[#f7f2e7] pb-16">
      <TravelRequestBoard />
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
        <TravelAdvisorRevenueOverview />
      </div>
    </div>
  );
}
