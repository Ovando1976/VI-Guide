import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Marketplace settlement reversal is not configured." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { bookingId?: unknown; confirmReference?: unknown; reason?: unknown }
      | null;
    const bookingId = clean(body?.bookingId, 180);
    const confirmReference = clean(body?.confirmReference, 180);
    const reason = clean(body?.reason, 400);
    if (!bookingId || !confirmReference || reason.length < 4) {
      return NextResponse.json(
        { error: "Booking reference and a clear reversal reason are required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("commerceBookings").doc(bookingId);
    const snapshot = await bookingRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    const booking = snapshot.data() ?? {};
    const reference = clean(booking.reference, 180) || bookingId;
    if (confirmReference !== reference) {
      return NextResponse.json(
        { error: "Type the exact booking reference to authorize reversal." },
        { status: 409 },
      );
    }

    const transferId = clean(booking.stripeTransferId, 220);
    const transferAmountCents = positiveMoney(booking.stripeTransferAmountCents);
    if (!transferId || !transferAmountCents) {
      return NextResponse.json(
        { error: "This booking does not have a released Stripe settlement." },
        { status: 409 },
      );
    }
    if (clean(booking.stripeTransferReversalId, 220)) {
      return NextResponse.json(
        { error: "This merchant settlement has already been reversed." },
        { status: 409 },
      );
    }
    if (clean(booking.settlementStatus, 40) !== "transferred") {
      return NextResponse.json(
        { error: "Only a completed merchant transfer can be reversed." },
        { status: 409 },
      );
    }
    if (clean(booking.paymentStatus, 40) !== "merchant_settled") {
      return NextResponse.json(
        { error: "The booking is not locked in merchant-settled state." },
        { status: 409 },
      );
    }

    const operationId = `settlement_reversal_${createHash("sha256")
      .update(`${bookingId}:${transferId}:${transferAmountCents}`)
      .digest("hex")
      .slice(0, 40)}`;
    const operationRef = db
      .collection("commerceSettlementReversalOperations")
      .doc(operationId);
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const [bookingCheck, operationCheck] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(operationRef),
      ]);
      if (!bookingCheck.exists) {
        throw new ReversalActionError("Booking not found.", 404);
      }
      const current = bookingCheck.data() ?? {};
      if (
        clean(current.stripeTransferId, 220) !== transferId ||
        positiveMoney(current.stripeTransferAmountCents) !== transferAmountCents ||
        clean(current.settlementStatus, 40) !== "transferred" ||
        clean(current.paymentStatus, 40) !== "merchant_settled"
      ) {
        throw new ReversalActionError(
          "Settlement changed before reversal. Refresh and review it again.",
          409,
        );
      }
      if (clean(current.stripeTransferReversalId, 220)) {
        throw new ReversalActionError(
          "This merchant settlement has already been reversed.",
          409,
        );
      }
      if (operationCheck.exists) {
        throw new ReversalActionError(
          "A reversal operation already exists and requires operations review.",
          409,
        );
      }

      transaction.create(operationRef, {
        bookingId,
        bookingReference: reference,
        stripeTransferId: transferId,
        amountCents: transferAmountCents,
        reason,
        status: "processing",
        requestedByUid: session.uid,
        requestedByEmail: session.email ?? null,
        requestedAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(bookingRef, {
        settlementStatus: "reversal_processing",
        settlementReversalOperationId: operationId,
        settlementReversalReason: reason,
        settlementUpdatedAt: now,
        updatedAt: now,
      });
    });

    try {
      const reversal = await getStripe().transfers.createReversal(
        transferId,
        {
          amount: transferAmountCents,
          description: `USVI Explorer settlement reversal ${reference}`,
          metadata: {
            bookingId,
            bookingReference: reference,
            settlementReversalOperationId: operationId,
            reason,
          },
        },
        {
          idempotencyKey: `vi-guide-settlement-reversal-${createHash("sha256")
            .update(operationId)
            .digest("hex")}`,
        },
      );

      const completedAt = new Date().toISOString();
      await db.runTransaction(async (transaction) => {
        const [bookingCheck, operationCheck] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(operationRef),
        ]);
        if (!bookingCheck.exists || !operationCheck.exists) return;
        if (clean(operationCheck.data()?.status, 40) === "succeeded") return;

        transaction.update(operationRef, {
          status: "succeeded",
          stripeTransferReversalId: reversal.id,
          completedAt,
          updatedAt: completedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(bookingRef, {
          paymentStatus: "paid",
          settlementStatus: "reversed",
          stripeTransferReversalId: reversal.id,
          stripeTransferReversedAmountCents: reversal.amount,
          settlementReversedAt: completedAt,
          settlementUpdatedAt: completedAt,
          updatedAt: completedAt,
        });
        transaction.set(db.collection("notifications").doc(), {
          audience: "operations",
          kind: "booking",
          priority: "high",
          title: "Merchant settlement reversed",
          message: `${formatMoney(reversal.amount)} was recovered from merchant settlement for ${reference}. Traveler refund is now unlocked for review.`,
          href: "/admin/commerce-refunds",
          reference,
          readAt: null,
          createdAt: completedAt,
          updatedAt: completedAt,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      });

      return NextResponse.json({
        ok: true,
        bookingId,
        reference,
        reversalId: reversal.id,
        amountCents: reversal.amount,
        refundUnlocked: true,
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      const message = stripeErrorMessage(error);
      await Promise.all([
        operationRef.set(
          {
            status: "review_required",
            failureReason: message,
            updatedAt: failedAt,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        bookingRef.set(
          {
            paymentStatus: "merchant_settled",
            settlementStatus: "review_required",
            settlementFailureReason: message,
            settlementUpdatedAt: failedAt,
            updatedAt: failedAt,
          },
          { merge: true },
        ),
      ]);
      return NextResponse.json(
        {
          error:
            "Stripe did not complete a clean transfer reversal. Traveler refund remains locked until operations reconciles the merchant settlement.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof ReversalActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("commerce settlement reversal error", error);
    return NextResponse.json(
      { error: "Unable to reverse merchant settlement." },
      { status: 500 },
    );
  }
}

class ReversalActionError extends Error {
  constructor(
    message: string,
    public status: 404 | 409,
  ) {
    super(message);
  }
}

function positiveMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100_000_000
    ? amount
    : 0;
}

function stripeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Stripe returned an unknown settlement reversal error.";
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
