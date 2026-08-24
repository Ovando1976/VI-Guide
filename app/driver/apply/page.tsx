import { redirect } from "next/navigation";

import { DriverApplicationForm } from "@/components/driver-application-form";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Drive with USVI Explorer",
  description:
    "Apply free to join USVI Explorer mobility. Verified USVI taxi credentials are required before driver access is activated.",
};

export default async function DriverApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/driver/apply");
  if (session.role === "driver") redirect("/driver");

  return <DriverApplicationForm email={session.email ?? ""} />;
}
