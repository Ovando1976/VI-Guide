import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import {
  expectedBookingAmountCents,
  paymentIntentIntegrityIssue,
} from "@/lib/booking-payment-state";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import type { RideBooking } from "@/types/mobility";

export async function approveOperatorSettlement(params: {
  bookingId: string;
  actorId: string;
  reviewReference: string;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const initialSnapshot = await bookingRef.get();
  if (!initialSnapshot.exists) throw new Error("Booking not found.");
  const initial = {
    id: initialSnapshot.id,
    ...initialSnapshot.data(),
  } as RideBooking;

  if (!initial.paymentIntentId) {
    throw new Error("Settlement cannot be approved without a Stripe payment reference.");
  }
  const paymentIntent = await getStripe().paymentIntents.retrieve(
    initial.paymentIntentId,
  );
  const integrityIssue = paymentIntentIntegrityIssue(paymentIntent, initial);
  if (integrityIssue) throw new Error(integrityIssue);
  if (paymentIntent.status !== "succeeded") {
    throw new Error("Settlement cannot be approved until Stripe confirms payment.");
  }

  const auditRef = db.collection("settlementAudit").doc();
  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;

    if (booking.paymentIntentId !== paymentIntent.id) {
      throw new Error("The booking payment reference changed during settlement review.");
    }
    if (booking.status !== "completed") {
      throw new Error("Only completed trips can enter operator settlement.");
    }
    if (!booking.settlement) {
      throw new Error("This trip does not have a settlement calculation.");
    }
    if (!["pending_review", "held"].includes(booking.settlement.status)) {
      throw new Error("This settlement is not awaiting approval.");
    }

    const expectedAmount = expectedBookingAmountCents(booking);
    if (
      booking.paymentStatus !== "paid" ||
      booking.amountAuthorized !== expectedAmount ||
      booking.amountCaptured !== expectedAmount ||
      paymentIntent.amount !== expectedAmount ||
      paymentIntent.amount_received !== expectedAmount
    ) {
      throw new Error("Captured payment does not equal the completed trip fare.");
    }

    const refundClear =
      !booking.refund ||
      (booking.refund.status === "not_required" && booking.refund.amount === 0) ||
      (booking.refund.status === "canceled" && booking.refund.amount === 0);
    if (!refundClear) {
      throw new Error("Settlement is blocked because a refund exists or is processing.");
    }

    const disputeClear =
      !booking.dispute ||
      (booking.dispute.status === "won" &&
        booking.dispute.fundsReinstated === true);
    if (!disputeClear) {
      throw new Error("Settlement is blocked because a payment dispute is unresolved.");
    }

    const allowedHold =
      !booking.financialHoldStatus ||
      booking.financialHoldStatus === "none" ||
      (booking.financialHoldStatus === "manual_review" && disputeClear);
    if (!allowedHold) {
      throw new Error(
        `Settlement is blocked by ${booking.financialHoldStatus?.replaceAll("_", " ")}.`,
      );
    }

    const approvedSettlement = {
      ...booking.settlement,
      status: "approved" as const,
      holdReason: null,
      reviewReference: params.reviewReference,
      approvedBy: params.actorId,
      approvedAt: FieldValue.serverTimestamp(),
    };
    transaction.update(bookingRef, {
      settlement: approvedSettlement,
      financialHoldStatus: "none",
      paymentIntegrityStatus: "verified",
      paymentIntegrityIssue: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(auditRef, {
      action: "operator_settlement_approved",
      auditId: auditRef.id,
      bookingId: booking.id,
      actorId: params.actorId,
      reviewReference: params.reviewReference,
      paymentIntentId: paymentIntent.id,
      capturedAmount: paymentIntent.amount_received,
      disputeId: booking.dispute?.id ?? null,
      disputeStatus: booking.dispute?.status ?? null,
      disputeFundsReinstated: booking.dispute?.fundsReinstated ?? null,
      settlement: {
        grossFare: booking.settlement.grossFare,
        serviceFee: booking.settlement.serviceFee ?? 0,
        operatorSettlement: booking.settlement.operatorSettlement ?? 0,
        feeAgreementId: booking.settlement.feeAgreementId ?? null,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return approvedSettlement;
  });

  return { bookingId: params.bookingId, settlement: result };
}

export async function holdOperatorSettlement(params: {
  bookingId: string;
  actorId: string;
  reason: string;
  reviewReference: string;
}) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(params.bookingId);
  const auditRef = db.collection("settlementAudit").doc();

  const settlement = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists) throw new Error("Booking not found.");
    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    if (booking.status !== "completed") {
      throw new Error("Only completed trips can have operator settlement held.");
    }
    if (!booking.settlement) {
      throw new Error("This trip does not have a settlement calculation.");
    }
    if (booking.settlement.status === "paid") {
      throw new Error("A recorded paid settlement cannot be changed by this control.");
    }

    const held = {
      ...booking.settlement,
      status: "held" as const,
      holdReason: params.reason,
      reviewReference: params.reviewReference,
      approvedBy: null,
      approvedAt: null,
    };
    transaction.update(bookingRef, {
      settlement: held,
      financialHoldStatus: "manual_review",
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(auditRef, {
      action: "operator_settlement_held",
      auditId: auditRef.id,
      bookingId: booking.id,
      actorId: params.actorId,
      reason: params.reason,
      reviewReference: params.reviewReference,
      priorStatus: booking.settlement.status,
      createdAt: FieldValue.serverTimestamp(),
    });
    return held;
  });

  return { bookingId: params.bookingId, settlement };
}
