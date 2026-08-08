import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-server";

export default async function MobilityPilotReadinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/pilot-readiness");
  if (session.role !== "admin") redirect("/unauthorized");
  return <>{children}</>;
}
