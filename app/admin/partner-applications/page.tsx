import { redirect } from "next/navigation";

import { PartnerApplicationBoard } from "@/components/admin/partner-application-board";
import { PartnerConversionSummary } from "@/components/admin/partner-conversion-summary";
import { PartnerPipelineBoard } from "@/components/admin/partner-pipeline-board";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Partner Applications | USVI Explorer",
  description:
    "Review and approve U.S. Virgin Islands businesses applying for USVI Explorer merchant tools.",
};

export default async function PartnerApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/partner-applications");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return (
    <>
      <PartnerConversionSummary />
      <PartnerPipelineBoard />
      <PartnerApplicationBoard />
    </>
  );
}
