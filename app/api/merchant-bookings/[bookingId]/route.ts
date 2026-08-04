import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type { CommerceBookingStatus } from "@/types/commerce-booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES: CommerceBookingStatus[] = [
  "reviewing",
  "payment_required",
  "paid",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
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
        paymentHref?: unknown;
      }
    | null;
  const status = clean(body?.status, 40) as CommerceBookingStatus;
  const merchantNote = clean(body?.merchantNote, 1200);
  const proposedTime = clean(body?.proposedTime, 40);
  const paymentHref = clean(body?.paymentHref, 500);
  const depositAmountCents = clampMoney(body?.depositAmountCents);

  if (!bookingId || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Choose a valid booking action." },
      { status: 400 },
    );
  }

  if (status === "payment_required" && depositAmountCents <= 0) {
    return NextResponse.json(
      { error: "Enter a deposit amount before requesting payment." },
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
  const reference = String(booking.reference ?? bookingId);
  const listingName = String(booking.listingName ?? "VI Guide booking");
  const updatedAt = new Date().toISOString();
  const lifecycle = lifecycleCopy(status, listingName, depositAmountCents);

  const batch = db.batch();
  batch.update(bookingRef, {
    status,
    updatedAt,
    merchantNote: merchantNote || null,
    proposedTime: proposedTime || null,
    depositAmountCents: status === "payment_required" ? depositAmountCents : booking.depositAmountCents ?? null,
    paymentHref: paymentHref || booking.paymentHref || null,
    merchantRespondedAt: updatedAt,
  });

  for (const audience of ["traveler", "operations"] as const) {
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      audience,
      kind: "booking",
      priority: status === "declined" || status === "cancelled" ? "high" : "normal",
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

  await batch.commit();

  return NextResponse.json({
    ok: true,
    booking: {
      id: bookingId,
      status,
      merchantNote: merchantNote || null,
      proposedTime: proposedTime || null,
      depositAmountCents: status === "payment_required" ? depositAmountCents : booking.depositAmountCents ?? null,
      paymentHref: paymentHref || booking.paymentHref || null,
      updatedAt,
    },
  });
}

function lifecycleCopy(status: CommerceBookingStatus, listingName: string, depositAmountCents: number) {
  if (status === "payment_required") {
    return {
      title: "Payment required",
      message: `${listingName} is ready to secure with a ${formatMoney(depositAmountCents)} deposit.`,
    };
  }
  if (status === "paid") {
    return { title: "Payment received", message: `Payment was recorded for ${listingName}.` };
  }
  if (status === "confirmed") {
    return { title: "Booking confirmed", message: `${listingName} is confirmed and ready for your trip.` };
  }
  if (status === "completed") {
    return { title: "Booking completed", message: `${listingName} has been marked complete.` };
  }
  if (status === "reviewing") {
    return { title: "Booking under review", message: `${listingName} is being reviewed by the provider.` };
  }
  if (status === "declined") {
    return { title: "Booking unavailable", message: `${listingName} could not be confirmed. Concierge can help with an alternative.` };
  }
  return { title: "Booking cancelled", message: `${listingName} has been cancelled.` };
}

function clampMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.min(10_000_000, Math.round(amount)));
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
