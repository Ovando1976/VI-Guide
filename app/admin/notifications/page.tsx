import { redirect } from "next/navigation";

import { NotificationOutboxBoard } from "@/components/admin/notification-outbox-board";
import { NotificationReconciliationControl } from "@/components/admin/notification-reconciliation-control";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "Notification Operations | VI Guide",
  description:
    "Inspect and recover traveler, merchant, and operations booking notifications.",
};

export default async function NotificationOperationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/notifications");
  if (!["admin", "dispatcher"].includes(session.role)) {
    redirect("/unauthorized");
  }

  return (
    <>
      {session.role === "admin" ? <NotificationReconciliationControl /> : null}
      <NotificationOutboxBoard />
    </>
  );
}
