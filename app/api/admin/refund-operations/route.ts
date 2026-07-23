import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    const snapshot = await getAdminDb()
      .collection("bookings")
      .where("refundStatus", "in", [
        "pending_review",
        "processing",
        "failed",
      ])
      .limit(200)
      .get();

    const bookings = snapshot.docs
      .map(
        (document) =>
          ({ id: document.id, ...document.data() }) as RideBooking,
      )
      .map(serializeRefundBooking)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    return NextResponse.json({
      ok: true,
      counts: {
        pendingReview: bookings.filter(
          (booking) => booking.refundStatus === "pending_review",
        ).length,
        processing: bookings.filter(
          (booking) => booking.refundStatus === "processing",
        ).length,
        failed: bookings.filter(
          (booking) => booking.refundStatus === "failed",
        ).length,
        requestedAmount: bookings.reduce(
          (total, booking) => total + Number(booking.refundRequestedAmount ?? 0),
          0,
        ),
      },
      bookings,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("refund operations queue error", error);
    return NextResponse.json(
      { error: "Unable to load refund operations." },
      { status: 500 },
    );
  }
}

function serializeRefundBooking(booking: RideBooking) {
  return {
    id: booking.id,
    riderId: booking.riderId,
    island: booking.island,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntegrityStatus: booking.paymentIntegrityStatus ?? "verified",
    paymentIntentId: booking.paymentIntentId ?? null,
    amountCaptured: booking.amountCaptured ?? null,
    refundStatus: booking.refundStatus ?? "not_required",
    refundId: booking.refundId ?? null,
    refundRequestedAmount: booking.refundRequestedAmount ?? null,
    refundAmount: booking.refundAmount ?? null,
    refundReason: booking.refundReason ?? null,
    refundFailureReason: booking.refundFailureReason ?? null,
    unexpectedCapturedPaymentIntentId:
      booking.unexpectedCapturedPaymentIntentId ?? null,
    origin: booking.origin?.estateName ?? "Pickup",
    destination: booking.destination?.estateName ?? "Destination",
    cancelledByRole: booking.cancelledByRole ?? null,
    updatedAt: serializeDate(booking.refundUpdatedAt ?? booking.updatedAt),
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
