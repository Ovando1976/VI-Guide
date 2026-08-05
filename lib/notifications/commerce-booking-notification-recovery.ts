import { FieldValue, type Firestore } from "firebase-admin/firestore";

import {
  normalizeBookingNotification,
  type BookingNotificationAudience,
  type BookingNotificationEvent,
} from "@/lib/notifications/booking-notification-outbox";
import { normalizeTimestamp } from "@/lib/timestamps";

type CommerceBookingRecoveryInput = {
  id: string;
  data: Record<string, unknown>;
};

type NormalizedBookingNotification = NonNullable<
  ReturnType<typeof normalizeBookingNotification>
>;

export function recoveryNotificationsForCommerceBooking({
  id,
  data,
}: CommerceBookingRecoveryInput) {
  const bookingId = clean(id, 160);
  const reference = clean(data.reference, 160) || bookingId;
  const listingId = clean(data.listingId, 160);
  const listingName = clean(data.listingName, 180) || "VI Guide booking";
  const travelerEmail = clean(data.email, 220);
  const status = clean(data.status, 40);
  const paymentStatus = clean(data.paymentStatus, 40);
  const refundStatus = clean(data.refundStatus, 40);
  const createdAt =
    normalizeTimestamp(data.createdAt) ?? normalizeTimestamp(data.updatedAt);
  const updatedAt = normalizeTimestamp(data.updatedAt) ?? createdAt;
  const paidAt = normalizeTimestamp(data.paidAt);
  const refundUpdatedAt = normalizeTimestamp(data.refundUpdatedAt) ?? updatedAt;
  const notifications = new Map<string, NormalizedBookingNotification>();

  function add(input: {
    event: BookingNotificationEvent;
    audiences: readonly BookingNotificationAudience[];
    title: string;
    message: string;
    createdAt?: string;
    travelerHref?: string;
    merchantHref?: string;
    operationsHref?: string;
  }) {
    const eventTime = input.createdAt ?? updatedAt ?? createdAt;
    if (!eventTime) return;

    for (const audience of input.audiences) {
      const notification = normalizeBookingNotification({
        bookingId,
        reference,
        event: input.event,
        audience,
        listingId,
        listingName,
        recipientEmail: audience === "traveler" ? travelerEmail : null,
        title: input.title,
        message: input.message,
        href:
          audience === "traveler"
            ? input.travelerHref ?? "/bookings"
            : audience === "merchant"
              ? input.merchantHref ?? "/merchant/lifecycle"
              : input.operationsHref ?? "/admin/operations",
        createdAt: eventTime,
      });
      if (notification) notifications.set(notification.id, notification);
    }
  }

  if (createdAt) {
    add({
      event: "booking_requested",
      audiences: ["traveler", "merchant", "operations"],
      title: "Booking request received",
      message: `${listingName} booking ${reference} was received by VI Guide.`,
      createdAt,
      merchantHref: "/merchant/reservations",
    });
  }

  if (status === "reviewing") {
    add({
      event: "booking_reviewing",
      audiences: ["traveler", "operations"],
      title: "Booking review started",
      message: `${listingName} booking ${reference} is being reviewed.`,
    });
  }

  if (status === "payment_required") {
    add({
      event: "payment_required",
      audiences: ["traveler", "operations"],
      title: "Deposit required",
      message: `${listingName} booking ${reference} is ready for its secure deposit.`,
    });
  }

  if (
    paidAt &&
    ["paid", "refund_pending", "refund_failed", "refunded"].includes(
      paymentStatus,
    )
  ) {
    add({
      event: "booking_paid",
      audiences: ["traveler", "merchant", "operations"],
      title: "Payment received",
      message: `${listingName} payment was received for booking ${reference}.`,
      createdAt: paidAt,
    });
  }

  if (status === "confirmed") {
    add({
      event: "booking_confirmed",
      audiences: ["traveler", "operations"],
      title: "Booking confirmed",
      message: `${listingName} booking ${reference} is confirmed.`,
    });
  }

  if (status === "completed") {
    add({
      event: "booking_completed",
      audiences: ["traveler", "operations"],
      title: "Booking completed",
      message: `${listingName} booking ${reference} was marked complete.`,
    });
  }

  if (status === "declined") {
    add({
      event: "booking_declined",
      audiences: ["traveler", "operations"],
      title: "Booking declined",
      message: `${listingName} booking ${reference} could not be accepted.`,
    });
  }

  if (
    status === "cancelled" &&
    refundStatus !== "succeeded" &&
    paymentStatus !== "refunded"
  ) {
    add({
      event: "booking_cancelled",
      audiences: ["traveler", "operations"],
      title: "Booking cancelled",
      message: `${listingName} booking ${reference} was cancelled.`,
    });
  }

  if (refundStatus === "succeeded" || paymentStatus === "refunded") {
    add({
      event: "booking_refunded",
      audiences: ["traveler", "merchant", "operations"],
      title: "Refund issued",
      message: `The verified refund for ${listingName} booking ${reference} was issued.`,
      createdAt: refundUpdatedAt,
      operationsHref: "/admin/commerce-refunds",
    });
  } else if (refundStatus === "failed" || paymentStatus === "refund_failed") {
    add({
      event: "refund_failed",
      audiences: ["operations"],
      title: "Refund delivery failed",
      message: `${listingName} booking ${reference} requires refund intervention.`,
      createdAt: refundUpdatedAt,
      operationsHref: "/admin/commerce-refunds",
    });
  } else if (refundStatus === "review_required") {
    add({
      event: "refund_review_required",
      audiences: ["operations"],
      title: "Refund needs review",
      message: `${listingName} booking ${reference} requires financial review.`,
      createdAt: refundUpdatedAt,
      operationsHref: "/admin/commerce-refunds",
    });
  }

  return Array.from(notifications.values());
}

export async function reconcileRecentCommerceBookingNotifications(
  db: Firestore,
  limit = 25,
) {
  const safeLimit = Math.max(1, Math.min(50, Math.round(limit)));
  const bookingSnapshot = await db
    .collection("commerceBookings")
    .orderBy("updatedAt", "desc")
    .limit(safeLimit)
    .get();
  const notifications = new Map<string, NormalizedBookingNotification>();

  for (const document of bookingSnapshot.docs) {
    for (const notification of recoveryNotificationsForCommerceBooking({
      id: document.id,
      data: document.data(),
    })) {
      notifications.set(notification.id, notification);
    }
  }

  const candidates = Array.from(notifications.values());
  if (!candidates.length) {
    return {
      scannedBookings: bookingSnapshot.size,
      candidates: 0,
      createdIds: [] as string[],
    };
  }

  const createdIds = await db.runTransaction(async (transaction) => {
    const records: Array<{
      notification: NormalizedBookingNotification;
      ref: FirebaseFirestore.DocumentReference;
      exists: boolean;
    }> = [];

    for (const notification of candidates) {
      const ref = db.collection("notificationOutbox").doc(notification.id);
      const snapshot = await transaction.get(ref);
      records.push({ notification, ref, exists: snapshot.exists });
    }

    const created: string[] = [];
    for (const record of records) {
      if (record.exists) continue;
      transaction.set(record.ref, {
        ...record.notification,
        recoverySource: "commerce_booking_reconciliation",
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      created.push(record.notification.id);
    }
    return created;
  });

  return {
    scannedBookings: bookingSnapshot.size,
    candidates: candidates.length,
    createdIds,
  };
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
