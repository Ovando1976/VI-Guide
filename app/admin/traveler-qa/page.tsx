import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthenticatedTravelerQa } from "@/components/admin/authenticated-traveler-qa";
import { getSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Authenticated Traveler QA | USVI Explorer",
  description:
    "Administrator-only production QA for the authenticated USVI Explorer traveler journey.",
};

export default async function AuthenticatedTravelerQaPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/traveler-qa");
  if (session.role !== "admin") redirect("/unauthorized");

  return <AuthenticatedTravelerQa serverRole={session.role} />;
}
