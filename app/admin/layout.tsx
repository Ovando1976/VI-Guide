import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin" && session.role !== "dispatcher") redirect("/unauthorized");
  return <>{children}</>;
}
