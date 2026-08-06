import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { validateSettlementPaymentEvidence } from "@/lib/settlement-payment-evidence";
import type { RideBooking } from "@/types/mobility";

export async function recordOperatorSettlementPaid(params: {
  bookingId: string;
  actorId: string;
  paidAmountCents: unknown;
  externalPaymentReference: unknown;
  externalPaymentMethod: unknown;
  paymentNote?: unknown;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const auditRef = db.collection("settlementAudit").doc();
  const paidAtIso = new Date().toISOString();

  const settlement = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists) throw new Error("Booking not found.");

    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    if (booking.status !== "completed") {
      throw new Error("Only completed trips can have settlement payment recorded.");
    }
    if (booking.paymentStatus !== "paid") {
      throw new Error("Settlement payment cannot be recorded unless the customer payment is paid.");
    }
    if (booking.paymentIntegrityStatus === "review_required") {
      throw new Error("Settlement payment is blocked by a payment-integrity review.");
    }

    const evidence = validateSettlementPaymentEvidence({
      settlement: booking.settlement,
      financialHoldStatus: booking.financialHoldStatus,
      refund: booking.refund,
      dispute: booking.dispute,
      paidAmountCents: params.paidAmountCents,
      externalPaymentReference: params.externalPaymentReference,
      externalPaymentMethod: params.externalPaymentMethod,
      paymentNote: params.paymentNote,
    });

    const paidSettlement = {
      ...booking.settlement!,
      status: "paid" as const,
      paidAmountCents: evidence.paidAmountCents,
      externalPaymentReference: evidence.externalPaymentReference,
      externalPaymentMethod: evidence.externalPaymentMethod,
      paymentNote: evidence.paymentNote,
      paidBy: params.actorId,
      paidAt: FieldValue.serverTimestamp(),
    };

    transaction.update(bookingRef, {
      settlement: paidSettlement,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(auditRef, {
      action: "operator_settlement_payment_recorded",
      auditId: auditRef.id,
      bookingId: booking.id,
      actorId: params.actorId,
      paidAmountCents: evidence.paidAmountCents,
      externalPaymentReference: evidence.externalPaymentReference,
      externalPaymentMethod: evidence.externalPaymentMethod,
      paymentNote: evidence.paymentNote,
      settlement: {
        grossFare: booking.settlement?.grossFare ?? 0,
        serviceFee: booking.settlement?.serviceFee ?? 0,
        operatorSettlement: booking.settlement?.operatorSettlement ?? 0,
        feeAgreementId: booking.settlement?.feeAgreementId ?? null,
        reviewReference: booking.settlement?.reviewReference ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      ...booking.settlement!,
      status: "paid" as const,
      paidAmountCents: evidence.paidAmountCents,
      externalPaymentReference: evidence.externalPaymentReference,
      externalPaymentMethod: evidence.externalPaymentMethod,
      paymentNote: evidence.paymentNote,
      paidBy: params.actorId,
      paidAt: paidAtIso,
    };
  });

  return { bookingId: params.bookingId, settlement };
}
