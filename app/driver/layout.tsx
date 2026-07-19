import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/driver");
  if (session.role !== "driver" && session.role !== "admin") redirect("/unauthorized");
  return <>{children}</>;
}
