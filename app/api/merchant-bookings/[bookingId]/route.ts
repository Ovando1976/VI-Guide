import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  isMerchantCommerceTransition,
  merchantCommerceTransitionError,
  normalizeCommerceLifecycleStatus,
  type MerchantCommerceTransition,
} from "@/lib/payments/commerce-booking-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    await requireSession(["admin", "dispatcher"]);

    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant bookings are not configured on the server." },
        { status: 503 },
      );
    }

    const bookingId = clean(params.bookingId, 160);
    const body = (await request.json().catch(() => null)) as
      | {
          status?: unknown;
          merchantNote?: unknown;
          proposedTime?: unknown;
          depositAmountCents?: unknown;
        }
      | null;
    const requestedStatus = clean(body?.status, 40);
    const merchantNote = clean(body?.merchantNote, 1200);
    const proposedTime = clean(body?.proposedTime, 40);
    const depositAmountCents = clampMoney(body?.depositAmountCents);

    if (!bookingId || !isMerchantCommerceTransition(requestedStatus)) {
      return NextResponse.json(
        {
          error:
            requestedStatus === "paid"
              ? "Paid status can only be recorded by the verified Stripe webhook."
              : "Choose a valid booking action.",
        },
        { status: 400 },
      );
    }

    const status: MerchantCommerceTransition = requestedStatus;
    const db = getAdminDb();
    const bookingRef = db.collection("commerceBookings").doc(bookingId);

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) {
        throw new BookingActionError("Booking not found.", 404);
      }

      const booking = snapshot.data() ?? {};
      const currentStatus = normalizeCommerceLifecycleStatus(booking.status);
      const transitionError = merchantCommerceTransitionError({
        currentStatus,
        nextStatus: status,
        depositAmountCents,
        hasActiveCheckout: Boolean(
          String(booking.checkoutSessionId ?? "").trim(),
        ),
      });
      if (transitionError) {
        throw new BookingActionError(transitionError, 409);
      }

      const reference = String(booking.reference ?? bookingId);
      const listingName = String(booking.listingName ?? "VI Guide booking");
      const updatedAt = new Date().toISOString();
      const lifecycle = lifecycleCopy(status, listingName, depositAmountCents);
      const paymentReset =
        status === "payment_required"
          ? {
              depositAmountCents,
              paidAmountCents: null,
              paymentStatus: "unpaid",
              paymentHref: null,
              checkoutSessionId: null,
              checkoutCreatedAt: null,
              paymentIntentId: null,
              paidAt: null,
            }
          : status === "declined" || status === "cancelled"
            ? {
                paymentStatus: booking.paymentStatus ?? "unpaid",
                paymentHref: null,
                checkoutSessionId: null,
              }
            : {};

      transaction.update(bookingRef, {
        status,
        updatedAt,
        merchantNote: merchantNote || null,
        proposedTime: proposedTime || null,
        merchantRespondedAt: updatedAt,
        ...paymentReset,
      });

      for (const audience of ["traveler", "operations"] as const) {
        const notificationRef = db.collection("notifications").doc();
        transaction.set(notificationRef, {
          audience,
          kind: "booking",
          priority:
            status === "declined" || status === "cancelled"
              ? "high"
              : "normal",
          title: lifecycle.title,
          message: lifecycle.message,
          href: audience === "traveler" ? "/bookings" : "/admin/operations",
          reference,
          readAt: null,
          createdAt: updatedAt,
          updatedAt,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        id: bookingId,
        status,
        merchantNote: merchantNote || null,
        proposedTime: proposedTime || null,
        depositAmountCents:
          status === "payment_required"
            ? depositAmountCents
            : Number(booking.depositAmountCents ?? 0) || null,
        paidAmountCents: Number(booking.paidAmountCents ?? 0) || null,
        paymentStatus:
          status === "payment_required"
            ? "unpaid"
            : String(booking.paymentStatus ?? "unpaid"),
        paymentHref: status === "payment_required" ? null : booking.paymentHref ?? null,
        checkoutSessionId:
          status === "payment_required" ? null : booking.checkoutSessionId ?? null,
        updatedAt,
      };
    });

    return NextResponse.json({ ok: true, booking: result });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof BookingActionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("merchant booking update error", error);
    return NextResponse.json(
      { error: "Unable to update this booking." },
      { status: 500 },
    );
  }
}

class BookingActionError extends Error {
  constructor(
    message: string,
    public status: 404 | 409,
  ) {
    super(message);
  }
}

function lifecycleCopy(
  status: MerchantCommerceTransition,
  listingName: string,
  depositAmountCents: number,
) {
  if (status === "payment_required") {
    return {
      title: "Payment required",
      message: `${listingName} is ready to secure with a ${formatMoney(
        depositAmountCents,
      )} deposit.`,
    };
  }
  if (status === "confirmed") {
    return {
      title: "Booking confirmed",
      message: `${listingName} is confirmed and ready for your trip.`,
    };
  }
  if (status === "completed") {
    return {
      title: "Booking completed",
      message: `${listingName} has been marked complete.`,
    };
  }
  if (status === "reviewing") {
    return {
      title: "Booking under review",
      message: `${listingName} is being reviewed by the provider.`,
    };
  }
  if (status === "declined") {
    return {
      title: "Booking unavailable",
      message: `${listingName} could not be confirmed. Concierge can help with an alternative.`,
    };
  }
  return {
    title: "Booking cancelled",
    message: `${listingName} has been cancelled.`,
  };
}

function clampMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.min(10_000_000, Math.round(amount)));
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
