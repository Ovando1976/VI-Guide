import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-server";

export default async function AgentControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/agents");
  if (session.role !== "admin") redirect("/unauthorized");
  return <>{children}</>;
}
