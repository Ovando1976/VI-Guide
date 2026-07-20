import { RiderOperationsCenter } from "@/components/rider-operations-center";
import { requireSession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function RiderOperationsPage() {
  await requireSession();
  return <RiderOperationsCenter />;
}
