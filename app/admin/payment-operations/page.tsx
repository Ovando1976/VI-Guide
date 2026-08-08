import { redirect } from "next/navigation";

import { DispatcherPaymentOperationsBoard } from "@/components/dispatcher-payment-operations-board";
import { PaymentOperationsBoard } from "@/components/payment-operations-board";
import { getSession } from "@/lib/auth-server";

export default async function PaymentOperationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/payment-operations");
  if (session.role !== "admin" && session.role !== "dispatcher") {
    redirect("/unauthorized");
  }

  return session.role === "admin" ? (
    <PaymentOperationsBoard />
  ) : (
    <DispatcherPaymentOperationsBoard />
  );
}
