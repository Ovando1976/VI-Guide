import { redirect } from "next/navigation";

import { CruiseRequestBoard } from "@/components/admin/cruise-request-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Cruise Advisor Desk | USVI Explorer",
  description:
    "Review and manage customer cruise-planning requests inside USVI Explorer operations.",
};

export default async function CruiseRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/cruise-requests");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return <CruiseRequestBoard />;
}
