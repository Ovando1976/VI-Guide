import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth-server";

export default async function TaxiTariffsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/tariffs");
  if (session.role !== "admin") redirect("/unauthorized");
  return <>{children}</>;
}
