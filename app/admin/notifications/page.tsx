import { redirect } from "next/navigation";

import { NotificationConfigurationPanel } from "@/components/admin/notification-configuration-panel";
import { NotificationOutboxBoard } from "@/components/admin/notification-outbox-board";
import { NotificationReconciliationControl } from "@/components/admin/notification-reconciliation-control";
import { getSession } from "@/lib/auth-server";
import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { notificationConfigurationStatus } from "@/lib/notifications/notification-configuration";

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

  const configuration = notificationConfigurationStatus({
    firebaseAdminConfigured: hasFirebaseAdminConfiguration(),
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.VI_GUIDE_EMAIL_FROM,
    operationsEmails: process.env.VI_GUIDE_OPERATIONS_EMAILS,
    cronSecret: process.env.CRON_SECRET,
    appUrl: process.env.VI_GUIDE_APP_URL,
  });

  return (
    <>
      <NotificationConfigurationPanel status={configuration} />
      {session.role === "admin" ? <NotificationReconciliationControl /> : null}
      <NotificationOutboxBoard />
    </>
  );
}
