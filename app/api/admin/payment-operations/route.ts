import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    const db = getAdminDb();
    const [
      reviewSnapshot,
      processingSnapshot,
      failedSnapshot,
      holdSnapshot,
      settlementSnapshot,
      refundSnapshot,
    ] = await Promise.all([
      db
        .collection("bookings")
        .where("paymentIntegrityStatus", "==", "review_required")
        .limit(100)
        .get(),
      db
        .collection("bookings")
        .where("paymentStatus", "==", "processing")
        .limit(100)
        .get(),
      db
        .collection("bookings")
        .where("paymentStatus", "in", ["failed", "canceled"])
        .limit(100)
        .get(),
      db
        .collection("bookings")
        .where("financialHoldStatus", "in", [
          "cancellation_processing",
          "refund_pending",
          "refund_review",
          "dispute_open",
          "dispute_lost",
          "manual_review",
        ])
        .limit(100)
        .get(),
      db
        .collection("bookings")
        .where("settlement.status", "in", ["pending_review", "held"])
        .limit(100)
        .get(),
      db
        .collection("bookings")
        .where("refund.status", "in", [
          "pending",
          "failed",
          "review_required",
        ])
        .limit(100)
        .get(),
    ]);

    const records = new Map<string, RideBooking>();
    for (const snapshot of [
      reviewSnapshot,
      processingSnapshot,
      failedSnapshot,
      holdSnapshot,
      settlementSnapshot,
      refundSnapshot,
    ]) {
      for (const document of snapshot.docs) {
        records.set(document.id, {
          id: document.id,
          ...document.data(),
        } as RideBooking);
      }
    }

    const bookings = Array.from(records.values())
      .map(serializePaymentBooking)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    return NextResponse.json({
      ok: true,
      counts: {
        reviewRequired: bookings.filter(
          (booking) => booking.paymentIntegrityStatus === "review_required",
        ).length,
        processing: bookings.filter(
          (booking) => booking.paymentStatus === "processing",
        ).length,
        failed: bookings.filter((booking) =>
          ["failed", "canceled"].includes(booking.paymentStatus),
        ).length,
        refunds: bookings.filter((booking) =>
          ["pending", "failed", "review_required"].includes(
            booking.refundStatus ?? "",
          ),
        ).length,
        disputes: bookings.filter((booking) => Boolean(booking.disputeId)).length,
        settlements: bookings.filter((booking) =>
          ["pending_review", "held"].includes(booking.settlementStatus ?? ""),
        ).length,
      },
      bookings,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("payment operations queue error", error);
    return NextResponse.json(
      { error: "Unable to load payment operations." },
      { status: 500 },
    );
  }
}

function serializePaymentBooking(booking: RideBooking) {
  return {
    id: booking.id,
    riderId: booking.riderId,
    island: booking.island,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntegrityStatus: booking.paymentIntegrityStatus ?? "verified",
    paymentIntegrityIssue: booking.paymentIntegrityIssue ?? null,
    financialHoldStatus: booking.financialHoldStatus ?? "none",
    paymentIntentId: booking.paymentIntentId ?? null,
    amountAuthorized: booking.amountAuthorized ?? null,
    amountCaptured: booking.amountCaptured ?? null,
    unexpectedCapturedPaymentIntentId:
      booking.unexpectedCapturedPaymentIntentId ?? null,
    unexpectedCapturedAmount: booking.unexpectedCapturedAmount ?? null,
    cancellationStatus: booking.cancellationStatus ?? null,
    cancellationReason: booking.cancellationReason ?? null,
    refundId: booking.refund?.id ?? null,
    refundStatus: booking.refund?.status ?? null,
    refundAmount: booking.refund?.amount ?? null,
    refundFailureReason: booking.refund?.failureReason ?? null,
    disputeId: booking.dispute?.id ?? null,
    disputeStatus: booking.dispute?.status ?? null,
    disputeAmount: booking.dispute?.amount ?? null,
    disputeReason: booking.dispute?.reason ?? null,
    disputeFundsReinstated: booking.dispute?.fundsReinstated ?? null,
    settlementStatus: booking.settlement?.status ?? null,
    settlementGrossFare: booking.settlement?.grossFare ?? null,
    settlementServiceFee: booking.settlement?.serviceFee ?? null,
    operatorSettlement: booking.settlement?.operatorSettlement ?? null,
    settlementHoldReason: booking.settlement?.holdReason ?? null,
    settlementReviewReference: booking.settlement?.reviewReference ?? null,
    origin: booking.origin?.estateName ?? "Pickup",
    destination: booking.destination?.estateName ?? "Destination",
    createdAt: serializeDate(booking.createdAt),
    updatedAt: serializeDate(
      booking.refund?.updatedAt ??
        booking.dispute?.updatedAt ??
        booking.paymentUpdatedAt ??
        booking.updatedAt,
    ),
  };
}

function serializeDate(value: unknown) {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      return candidate.toDate().toISOString();
    }
  }
  if (typeof value === "object" && value && "seconds" in value) {
    const candidate = value as { seconds?: number };
    if (typeof candidate.seconds === "number") {
      return new Date(candidate.seconds * 1000).toISOString();
    }
  }
  return new Date(0).toISOString();
}
