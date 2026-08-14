import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { normalizeCommerceRefundStatus } from "@/lib/payments/commerce-refund-integrity";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Commerce refund operations are not configured." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("commerceBookings")
      .where("paymentStatus", "in", [
        "paid",
        "refund_pending",
        "refund_failed",
        "refunded",
      ])
      .limit(200)
      .get();

    const bookings = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          reference: String(data.reference ?? document.id),
          listingName: String(data.listingName ?? "USVI Explorer booking"),
          guestName: String(data.guestName ?? "Guest"),
          email: String(data.email ?? ""),
          status: String(data.status ?? "requested"),
          paymentStatus: String(data.paymentStatus ?? "unpaid"),
          paymentIntentId: data.paymentIntentId
            ? String(data.paymentIntentId)
            : null,
          paidAmountCents: Number(data.paidAmountCents ?? 0),
          paidAt: data.paidAt ? String(data.paidAt) : null,
          refundStatus: normalizeCommerceRefundStatus(data.refundStatus),
          refundId: data.refundId ? String(data.refundId) : null,
          refundOperationId: data.refundOperationId
            ? String(data.refundOperationId)
            : null,
          refundAmountCents: Number(data.refundAmountCents ?? 0) || null,
          refundReason: data.refundReason ? String(data.refundReason) : null,
          refundFailureReason: data.refundFailureReason
            ? String(data.refundFailureReason)
            : null,
          refundRequestedAt: data.refundRequestedAt
            ? normalizeTimestampOrEpoch(data.refundRequestedAt)
            : null,
          refundUpdatedAt: data.refundUpdatedAt
            ? normalizeTimestampOrEpoch(data.refundUpdatedAt)
            : null,
          cancellationRequestStatus: data.cancellationRequestStatus
            ? String(data.cancellationRequestStatus)
            : "not_requested",
          cancellationReasonCode: data.cancellationReasonCode
            ? String(data.cancellationReasonCode)
            : null,
          cancellationReason: data.cancellationReason
            ? String(data.cancellationReason)
            : null,
          cancellationRefundEstimateCents: Number(
            data.cancellationRefundEstimateCents ?? 0,
          ),
          cancellationRequestedAt: data.cancellationRequestedAt
            ? normalizeTimestampOrEpoch(data.cancellationRequestedAt)
            : null,
          updatedAt: normalizeTimestampOrEpoch(
            data.refundUpdatedAt ?? data.updatedAt ?? data.createdAt,
          ),
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return NextResponse.json({
      canIssueRefunds: session.role === "admin",
      bookings,
      counts: {
        refundable: bookings.filter(
          (booking) =>
            booking.paymentStatus === "paid" &&
            booking.refundStatus === "not_requested",
        ).length,
        processing: bookings.filter(
          (booking) => booking.refundStatus === "processing",
        ).length,
        failed: bookings.filter((booking) => booking.refundStatus === "failed")
          .length,
        refunded: bookings.filter(
          (booking) => booking.refundStatus === "succeeded",
        ).length,
        cancellationRequested: bookings.filter(
          (booking) => booking.cancellationRequestStatus === "review_required",
        ).length,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce refund queue error", error);
    return NextResponse.json(
      { error: "Unable to load commerce refund operations." },
      { status: 500 },
    );
  }
}
