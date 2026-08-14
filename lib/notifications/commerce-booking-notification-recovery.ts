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
  const listingName = clean(data.listingName, 180) || "USVI Explorer booking";
  const travelerEmail = clean(data.email, 220);
  const paymentStatus = clean(data.paymentStatus, 40);
  const paymentIntegrityStatus = clean(data.paymentIntegrityStatus, 40);
  const refundStatus = clean(data.refundStatus, 40);
  const updatedAt =
    normalizeTimestamp(data.updatedAt) ?? normalizeTimestamp(data.createdAt);
  const paidAt = normalizeTimestamp(data.paidAt);
  const refundUpdatedAt = normalizeTimestamp(data.refundUpdatedAt) ?? updatedAt;
  const notifications = new Map<string, NormalizedBookingNotification>();

  function add(input: {
    event: BookingNotificationEvent;
    audiences: readonly BookingNotificationAudience[];
    title: string;
    message: string;
    createdAt?: string;
    operationsHref?: string;
  }) {
    const eventTime = input.createdAt ?? updatedAt;
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
            ? "/bookings"
            : audience === "merchant"
              ? "/merchant/lifecycle"
              : input.operationsHref ?? "/admin/operations",
        createdAt: eventTime,
      });
      if (notification) notifications.set(notification.id, notification);
    }
  }

  const verifiedPayment =
    paidAt &&
    paymentIntegrityStatus !== "review_required" &&
    refundStatus !== "review_required" &&
    ["paid", "refund_pending", "refund_failed", "refunded"].includes(
      paymentStatus,
    );

  if (verifiedPayment) {
    add({
      event: "booking_paid",
      audiences: ["traveler", "merchant", "operations"],
      title: "Payment received",
      message: `${listingName} payment was received for booking ${reference}.`,
      createdAt: paidAt,
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
        recoverySource: "commerce_financial_reconciliation",
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
