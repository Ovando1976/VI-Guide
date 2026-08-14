import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  cancellationRefundEstimate,
  normalizeCancellationPolicy,
} from "@/lib/booking/cancellation-policy";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = new Set([
  "plans_changed",
  "weather_concern",
  "transportation_issue",
  "provider_issue",
  "duplicate_booking",
  "other",
]);
const CANCELLABLE = new Set([
  "requested",
  "reviewing",
  "payment_required",
  "paid",
  "confirmed",
]);

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking cancellations are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { reference?: unknown; email?: unknown; reasonCode?: unknown; reason?: unknown }
    | null;
  const reference = clean(body?.reference, 80).toUpperCase();
  const email = clean(body?.email, 220).toLowerCase();
  const reasonCode = clean(body?.reasonCode, 40);
  const reason = clean(body?.reason, 400);
  if (
    !reference ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !REASONS.has(reasonCode) ||
    (reasonCode === "other" && reason.length < 4)
  ) {
    return NextResponse.json(
      { error: "Choose a cancellation reason and verify the booking details." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const matches = await db
    .collection("commerceBookings")
    .where("reference", "==", reference)
    .limit(1)
    .get();
  if (matches.empty) return notFound();
  const bookingRef = matches.docs[0].ref;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) throw new CancellationError("Booking not found.", 404);
      const booking = snapshot.data() ?? {};
      if (clean(booking.email, 220).toLowerCase() !== email) {
        throw new CancellationError("Booking not found.", 404);
      }

      const status = clean(booking.status, 40) || "requested";
      const existing = clean(booking.cancellationRequestStatus, 40);
      if (status === "cancelled" || existing === "completed") {
        return {
          status: "completed" as const,
          message: "This booking is already cancelled.",
        };
      }
      if (existing === "review_required") {
        return {
          status: "review_required" as const,
          message: "Your cancellation and refund request is already under review.",
        };
      }
      if (!CANCELLABLE.has(status)) {
        throw new CancellationError(
          status === "completed"
            ? "Completed bookings cannot be cancelled through self-service."
            : "This booking is not eligible for self-service cancellation.",
          409,
        );
      }

      const paidAmountCents = Math.max(0, Number(booking.paidAmountCents ?? 0));
      const hasCapturedPayment =
        paidAmountCents > 0 || clean(booking.paymentStatus, 40) === "paid";
      const policy = normalizeCancellationPolicy(booking.cancellationPolicy);
      const estimate = policy
        ? cancellationRefundEstimate({
            policy,
            startDate: clean(booking.startDate, 10),
            preferredTime: clean(booking.preferredTime, 10) || null,
            paidAmountCents,
          })
        : { amountCents: 0, disposition: "review_required" as const };
      const now = new Date().toISOString();
      const nextStatus = hasCapturedPayment ? "review_required" : "completed";

      transaction.update(bookingRef, {
        ...(hasCapturedPayment
          ? {}
          : { status: "cancelled", paymentHref: null, checkoutSessionId: null }),
        cancellationRequestStatus: nextStatus,
        cancellationReasonCode: reasonCode,
        cancellationReason: reason || null,
        cancellationRequestedAt: now,
        cancellationRequestedBy: "traveler",
        cancellationRefundEstimateCents: estimate.amountCents,
        cancellationRefundDisposition: estimate.disposition,
        ...(hasCapturedPayment ? {} : { cancellationResolvedAt: now }),
        updatedAt: now,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });

      for (const audience of ["traveler", "operations"] as const) {
        const notification = db.collection("notifications").doc();
        transaction.set(notification, {
          audience,
          kind: "booking",
          priority: "high",
          title: hasCapturedPayment
            ? "Cancellation review requested"
            : "Booking cancelled",
          message: hasCapturedPayment
            ? `${String(booking.listingName ?? "USVI Explorer booking")} requires cancellation and refund review.`
            : `${String(booking.listingName ?? "USVI Explorer booking")} was cancelled before payment.`,
          href: audience === "traveler" ? "/bookings" : "/admin/commerce-refunds",
          reference,
          readAt: null,
          createdAt: now,
          updatedAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        status: nextStatus,
        refundEstimateCents: estimate.amountCents,
        refundDisposition: estimate.disposition,
        message: hasCapturedPayment
          ? "Your cancellation request is under review. No refund is promised until payment records and the disclosed policy are verified."
          : "Your booking request has been cancelled. No payment was captured.",
      };
    });
    return NextResponse.json({ ok: true, cancellation: result });
  } catch (error) {
    if (error instanceof CancellationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("traveler cancellation request error", error);
    return NextResponse.json(
      { error: "Unable to submit the cancellation request." },
      { status: 500 },
    );
  }
}

function notFound() {
  return NextResponse.json(
    { error: "No booking request matched that reference and email." },
    { status: 404 },
  );
}

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

class CancellationError extends Error {
  constructor(message: string, public status: 404 | 409) {
    super(message);
  }
}
