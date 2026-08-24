import { redirect } from "next/navigation";

import { DriverApplicationBoard } from "@/components/admin/driver-application-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Driver Applications | USVI Explorer",
  description:
    "Review USVI taxi driver applications and activate verified driver access.",
};

export default async function DriverApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/driver-applications");
  if (session.role !== "admin") redirect("/unauthorized");

  return <DriverApplicationBoard />;
}
