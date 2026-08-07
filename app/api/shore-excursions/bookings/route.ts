import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getUsviToday,
  isBookableStartDate,
} from "@/lib/booking/booking-dates";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveMerchantOfferForBooking } from "@/lib/merchant-offer-booking";
import { merchantOfferDemandPatch } from "@/lib/merchant-offer-demand";
import {
  merchantOfferRequestQuotaAllows,
  merchantOfferRequestQuotaDocumentId,
} from "@/lib/merchant-offer-request-id";
import { processBookingNotificationOutboxIds } from "@/lib/notifications/booking-notification-delivery";
import { normalizeBookingNotification } from "@/lib/notifications/booking-notification-outbox";
import {
  evaluateShoreExcursionTiming,
  normalizeCruiseLine,
  normalizeShipName,
  normalizeShoreExcursionProfile,
  normalizeShoreExcursionStatus,
  normalizeTime,
  shoreExcursionBookingDocumentId,
  shoreExcursionDateWithinOfferWindow,
  shoreExcursionPort,
} from "@/lib/shore-excursions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingInput = {
  offerId?: unknown;
  startDate?: unknown;
  preferredTime?: unknown;
  adults?: unknown;
  children?: unknown;
  guestName?: unknown;
  email?: unknown;
  phone?: unknown;
  notes?: unknown;
  shipName?: unknown;
  cruiseLine?: unknown;
  portId?: unknown;
  allAboardTime?: unknown;
};

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Shore excursion bookings are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as BookingInput | null;
  if (!body) {
    return NextResponse.json(
      { error: "Complete the shore excursion request." },
      { status: 400 },
    );
  }

  const offerId = clean(body.offerId, 160);
  const db = getAdminDb();
  const requestNow = new Date();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const offerRef = db.collection("merchantOffers").doc(offerId);
      const profileRef = db.collection("shoreExcursions").doc(offerId);
      const [offerDocument, profileDocument] = await Promise.all([
        transaction.get(offerRef),
        transaction.get(profileRef),
      ]);

      const offerResolution = resolveMerchantOfferForBooking({
        offerId,
        record: offerDocument.exists ? offerDocument.data() ?? {} : null,
        now: requestNow,
      });
      if (!offerResolution.ok) {
        throw new ShoreBookingError(offerResolution.error, offerResolution.status);
      }
      if (!profileDocument.exists) {
        throw new ShoreBookingError(
          "This shore excursion is not currently available.",
          404,
        );
      }

      const profileData = profileDocument.data() ?? {};
      if (normalizeShoreExcursionStatus(profileData.status) !== "active") {
        throw new ShoreBookingError(
          "This shore excursion is not currently available.",
          409,
        );
      }
      const profileResolution = normalizeShoreExcursionProfile({
        profile: profileData,
        offer: offerResolution.snapshot,
      });
      if (!profileResolution.ok) {
        throw new ShoreBookingError(
          "This shore excursion needs operator review before it can be booked.",
          409,
        );
      }

      const profile = profileResolution.profile;
      const startDate = clean(body.startDate, 10);
      const preferredTime = normalizeTime(body.preferredTime);
      const allAboardTime = normalizeTime(body.allAboardTime);
      const guestName = clean(body.guestName, 160);
      const email = clean(body.email, 220).toLowerCase();
      const phone = clean(body.phone, 40);
      const notes = cleanMultiline(body.notes, 1600);
      const shipName = normalizeShipName(body.shipName);
      const cruiseLine = normalizeCruiseLine(body.cruiseLine);
      const port = shoreExcursionPort(body.portId);
      const adults = normalizeGuests(body.adults, 1);
      const children = normalizeGuests(body.children, 0);
      const partySize = adults + children;
      const today = getUsviToday(requestNow);

      if (
        !offerId ||
        !isBookableStartDate(startDate, today) ||
        !preferredTime ||
        !allAboardTime ||
        !guestName ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        shipName.length < 2 ||
        !port ||
        port.island !== profile.island ||
        !profile.supportedPorts.includes(port.id) ||
        partySize < 1
      ) {
        throw new ShoreBookingError(
          "Complete the cruise ship, port, all-aboard time, excursion time, and traveler details.",
          400,
        );
      }
      if (
        !shoreExcursionDateWithinOfferWindow({
          startDate,
          validFrom: offerResolution.snapshot.validFrom,
          validThrough: offerResolution.snapshot.validThrough,
        })
      ) {
        throw new ShoreBookingError(
          `This shore-excursion offer is not valid for ${startDate}. Choose a port date between ${offerResolution.snapshot.validFrom} and ${offerResolution.snapshot.validThrough}.`,
          409,
        );
      }
      if (partySize > profile.maxGuests) {
        throw new ShoreBookingError(
          `This excursion accepts up to ${profile.maxGuests} guests per request.`,
          409,
        );
      }

      const timing = evaluateShoreExcursionTiming({
        startTime: preferredTime,
        allAboardTime,
        durationMinutes: profile.durationMinutes,
        minReturnBufferMinutes: profile.minReturnBufferMinutes,
      });
      if (!timing.ok) {
        if (timing.reason === "insufficient_return_buffer") {
          throw new ShoreBookingError(
            `That start time does not leave the required ${profile.minReturnBufferMinutes}-minute return-to-ship buffer. Choose ${timing.latestSafeStartTime ?? "an earlier time"} or earlier.`,
            409,
          );
        }
        throw new ShoreBookingError(
          "The excursion time must be before the ship's same-day all-aboard time.",
          400,
        );
      }

      const bookingId = shoreExcursionBookingDocumentId({
        offerId,
        email,
        startDate,
        preferredTime,
        shipName,
        portId: port.id,
        allAboardTime,
        adults,
        children,
        durationMinutes: profile.durationMinutes,
        minReturnBufferMinutes: profile.minReturnBufferMinutes,
        offerPriceCents: offerResolution.snapshot.offerPriceCents,
      });
      const bookingRef = db.collection("commerceBookings").doc(bookingId);
      const existing = await transaction.get(bookingRef);
      if (existing.exists) {
        const existingData = existing.data() ?? {};
        const reference = clean(existingData.reference, 160);
        if (!reference) {
          throw new ShoreBookingError(
            "The existing shore excursion request could not be verified.",
            409,
          );
        }
        return {
          duplicate: true,
          bookingId,
          reference,
          notificationOutboxIds: [] as string[],
        };
      }

      const quotaRef = db
        .collection("merchantOfferRequestIntake")
        .doc(merchantOfferRequestQuotaDocumentId({ email, now: requestNow }));
      const quotaDocument = await transaction.get(quotaRef);
      const quotaCount = Number(quotaDocument.data()?.count ?? 0);
      if (!merchantOfferRequestQuotaAllows(quotaCount)) {
        throw new ShoreBookingError(
          "Unable to accept additional offer requests for this email today.",
          429,
        );
      }

      const reference = createReference();
      const now = requestNow.toISOString();
      const offer = offerResolution.snapshot;
      transaction.set(bookingRef, {
        kind: offer.kind,
        listingId: offer.listingId,
        listingName: offer.listingName,
        listingHref: `/shore-excursions/${encodeURIComponent(offer.offerId)}`,
        offerId: offer.offerId,
        offerTitle: offer.offerTitle,
        offerPriceCents: offer.offerPriceCents,
        offerCompareAtCents: offer.offerCompareAtCents,
        offerDepositCents: offer.offerDepositCents,
        offerValidFrom: offer.validFrom,
        offerValidThrough: offer.validThrough,
        island: offer.island,
        startDate,
        preferredTime,
        adults,
        children,
        guestName,
        email,
        ...(phone ? { phone } : {}),
        ...(notes ? { notes } : {}),
        shoreExcursion: {
          shipName,
          cruiseLine: cruiseLine || null,
          portId: port.id,
          portLabel: port.label,
          allAboardTime,
          meetingPoint: profile.meetingPoint,
          pickupIncluded: profile.pickupIncluded,
          durationMinutes: profile.durationMinutes,
          minReturnBufferMinutes: profile.minReturnBufferMinutes,
          excursionEndsAt: timing.excursionEndsAt,
          safeReturnDeadline: timing.safeReturnDeadline,
          latestSafeStartTime: timing.latestSafeStartTime,
          verifiedReturnBufferMinutes: timing.bufferMinutes,
          timingStatus: "buffer_verified",
        },
        reference,
        status: "requested",
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        source: "vi-guide-shore-excursion",
      });

      transaction.set(
        quotaRef,
        {
          dayKey: getUsviToday(requestNow),
          count: quotaCount + 1,
          lastSubmittedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      transaction.update(offerRef, {
        ...merchantOfferDemandPatch(offerDocument.data() ?? {}, requestNow),
        serverDemandUpdatedAt: FieldValue.serverTimestamp(),
      });

      const notificationInputs = [
        {
          audience: "traveler" as const,
          recipientEmail: email,
          title: "Shore excursion request received",
          message: `We received your ${offer.offerTitle} request for ${shipName}. Your plan keeps the operator's return-to-ship buffer before ${allAboardTime}.`,
          href: `/bookings?booking=${encodeURIComponent(bookingId)}`,
        },
        {
          audience: "merchant" as const,
          recipientEmail: null,
          title: "New cruise shore excursion request",
          message: `${guestName} requested ${offer.offerTitle} from ${port.shortLabel}. Ship: ${shipName}; all aboard ${allAboardTime}.`,
          href: "/merchant/reservations",
        },
        {
          audience: "operations" as const,
          recipientEmail: null,
          title: "Cruise excursion request",
          message: `${offer.listingName} received ${reference} for ${shipName}; return buffer verified at request time.`,
          href: "/admin/operations",
        },
      ];
      const notificationOutboxIds: string[] = [];

      for (const input of notificationInputs) {
        const notification = normalizeBookingNotification({
          bookingId,
          reference,
          event: "booking_requested",
          audience: input.audience,
          listingId: offer.listingId,
          listingName: offer.listingName,
          recipientEmail: input.recipientEmail,
          title: input.title,
          message: input.message,
          href: input.href,
          createdAt: now,
        });
        if (!notification) {
          throw new Error("Unable to prepare shore excursion notifications.");
        }
        notificationOutboxIds.push(notification.id);
        transaction.set(db.collection("notificationOutbox").doc(notification.id), {
          ...notification,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { duplicate: false, bookingId, reference, notificationOutboxIds };
    });

    if (result.notificationOutboxIds.length) {
      try {
        await processBookingNotificationOutboxIds(db, result.notificationOutboxIds);
      } catch (error) {
        console.error("shore excursion notification delivery attempt failed", error);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        bookingId: result.bookingId,
        reference: result.reference,
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof ShoreBookingError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          ...(error.status === 429
            ? { headers: { "Retry-After": "3600" } }
            : {}),
        },
      );
    }
    console.error("shore excursion booking error", error);
    return NextResponse.json(
      { error: "Unable to submit the shore excursion request right now." },
      { status: 500 },
    );
  }
}

function normalizeGuests(value: unknown, fallback: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return Math.max(0, Math.min(100, Math.trunc(amount)));
}

function createReference() {
  return `VI-SHORE-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function cleanMultiline(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxLength)
    : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

class ShoreBookingError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 429,
  ) {
    super(message);
  }
}
