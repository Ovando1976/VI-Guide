import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  getUsviToday,
  isBookableEndDate,
  isBookableStartDate,
} from "@/lib/booking/booking-dates";
import {
  resolveMerchantOfferForBooking,
  type MerchantOfferBookingSnapshot,
} from "@/lib/merchant-offer-booking";
import { merchantOfferDemandPatch } from "@/lib/merchant-offer-demand";
import {
  merchantOfferRequestDocumentId,
  merchantOfferRequestQuotaAllows,
  merchantOfferRequestQuotaDocumentId,
} from "@/lib/merchant-offer-request-id";
import { normalizeMerchantOfferId } from "@/lib/merchant-offers";
import { processBookingNotificationOutboxIds } from "@/lib/notifications/booking-notification-delivery";
import { normalizeBookingNotification } from "@/lib/notifications/booking-notification-outbox";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";
import type {
  CommerceBookingKind,
  CommerceBookingRequest,
} from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_KINDS: CommerceBookingKind[] = [
  "accommodation",
  "tour",
  "experience",
];
const ISLANDS: IntelligenceIsland[] = ["stt", "stj", "stx"];

type CommerceBookingSubmission = Partial<CommerceBookingRequest> & {
  proposalShareId?: unknown;
};

type ProposalCandidate = {
  shareId: string;
  travelRequestId: string;
  reference: string;
  email: string;
  requestRef: FirebaseFirestore.DocumentReference;
};

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking requests are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | CommerceBookingSubmission
    | null;
  if (!body) {
    return NextResponse.json(
      {
        error:
          "Please complete the required booking information with future travel dates.",
      },
      { status: 400 },
    );
  }

  const rawOfferId = clean(body.offerId, 160);
  const offerId = rawOfferId ? normalizeMerchantOfferId(rawOfferId) : "";
  if (rawOfferId && !offerId) {
    return NextResponse.json(
      { error: "Choose a valid VI Guide offer." },
      { status: 400 },
    );
  }
  const proposalShareId = normalizeProposalShareId(body.proposalShareId);

  const db = getAdminDb();
  const requestNow = new Date();

  try {
    const result = await db.runTransaction(async (transaction) => {
      let proposalCandidate: ProposalCandidate | null = null;
      if (proposalShareId) {
        const shareRef = db.collection("sharedJourneys").doc(proposalShareId);
        const shareSnapshot = await transaction.get(shareRef);
        const share = shareSnapshot.exists ? shareSnapshot.data() ?? {} : {};
        const travelRequestId = normalizeTravelRequestId(share.travelRequestId);
        if (
          shareSnapshot.exists &&
          share.source === "travel_advisor_proposal" &&
          travelRequestId
        ) {
          const requestRef = db
            .collection("travelPlanningRequests")
            .doc(travelRequestId);
          const travelRequestSnapshot = await transaction.get(requestRef);
          if (travelRequestSnapshot.exists) {
            const travelRequest = travelRequestSnapshot.data() ?? {};
            proposalCandidate = {
              shareId: proposalShareId,
              travelRequestId,
              reference: clean(travelRequest.reference, 120),
              email: clean(travelRequest.email, 220).toLowerCase(),
              requestRef,
            };
          }
        }
      }

      let offerSnapshot: MerchantOfferBookingSnapshot | null = null;
      let offerRef: FirebaseFirestore.DocumentReference | null = null;
      let offerRecord: FirebaseFirestore.DocumentData | null = null;
      let requestQuotaRef: FirebaseFirestore.DocumentReference | null = null;
      let requestQuotaCount = 0;
      let bookingInput: Partial<CommerceBookingRequest> = body;

      if (offerId) {
        offerRef = db.collection("merchantOffers").doc(offerId);
        const offerDocument = await transaction.get(offerRef);
        offerRecord = offerDocument.exists ? offerDocument.data() ?? {} : null;
        const resolution = resolveMerchantOfferForBooking({
          offerId,
          record: offerRecord,
          now: requestNow,
        });
        if (!resolution.ok) {
          throw new CommerceBookingActionError(
            resolution.error,
            resolution.status,
          );
        }
        offerSnapshot = resolution.snapshot;
        bookingInput = {
          ...body,
          offerId: offerSnapshot.offerId,
          kind: offerSnapshot.kind,
          listingId: offerSnapshot.listingId,
          listingName: offerSnapshot.listingName,
          island: offerSnapshot.island,
          listingHref: `/offers/${encodeURIComponent(offerSnapshot.offerId)}`,
        };
      }

      const booking = normalizeBooking(bookingInput, requestNow);
      if (!booking) {
        throw new CommerceBookingActionError(
          "Please complete the required booking information with future travel dates.",
          400,
        );
      }

      const proposalAttribution =
        proposalCandidate && proposalCandidate.email === booking.email
          ? proposalCandidate
          : null;

      let bookingRef = db.collection("commerceBookings").doc();
      if (offerSnapshot) {
        bookingRef = db
          .collection("commerceBookings")
          .doc(
            merchantOfferRequestDocumentId({
              offerId: offerSnapshot.offerId,
              email: booking.email,
              startDate: booking.startDate,
              endDate: booking.endDate ?? null,
              preferredTime: booking.preferredTime ?? null,
              adults: booking.adults,
              children: booking.children,
              offerPriceCents: offerSnapshot.offerPriceCents,
              offerDepositCents: offerSnapshot.offerDepositCents,
              now: requestNow,
            }),
          );
        const existing = await transaction.get(bookingRef);
        if (existing.exists) {
          const data = existing.data() ?? {};
          const reference = clean(data.reference, 160);
          if (!reference) {
            throw new CommerceBookingActionError(
              "The existing offer request could not be verified.",
              409,
            );
          }

          const existingTravelRequestId = normalizeTravelRequestId(
            data.travelRequestId,
          );
          const canLinkDuplicate = Boolean(
            proposalAttribution &&
              (!existingTravelRequestId ||
                existingTravelRequestId === proposalAttribution.travelRequestId),
          );
          if (canLinkDuplicate && proposalAttribution) {
            transaction.set(
              bookingRef,
              {
                travelProposalShareId: proposalAttribution.shareId,
                travelRequestId: proposalAttribution.travelRequestId,
                travelRequestReference: proposalAttribution.reference || null,
                updatedAt: requestNow.toISOString(),
              },
              { merge: true },
            );
            transaction.set(
              proposalAttribution.requestRef,
              {
                latestCommerceBookingId: bookingRef.id,
                latestCommerceBookingReference: reference,
                latestCommerceBookingStatus: clean(data.status, 40) || "requested",
                latestBookingRequestedAt: clean(data.createdAt, 50) || requestNow.toISOString(),
                updatedAt: requestNow.toISOString(),
                serverUpdatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          }

          return {
            duplicate: true,
            bookingId: bookingRef.id,
            reference,
            status: clean(data.status, 40) || "requested",
            offer: offerResponse(data, offerSnapshot),
            notificationOutboxIds: [] as string[],
            linkedToTravelRequest: canLinkDuplicate,
          };
        }

        requestQuotaRef = db
          .collection("merchantOfferRequestIntake")
          .doc(
            merchantOfferRequestQuotaDocumentId({
              email: booking.email,
              now: requestNow,
            }),
          );
        const quotaDocument = await transaction.get(requestQuotaRef);
        requestQuotaCount = Number(quotaDocument.data()?.count ?? 0);
        if (!merchantOfferRequestQuotaAllows(requestQuotaCount)) {
          throw new CommerceBookingActionError(
            "Unable to accept additional offer requests for this email today.",
            429,
          );
        }
      }

      const reference = createReference(booking.kind);
      const now = requestNow.toISOString();
      transaction.set(bookingRef, {
        ...booking,
        ...(offerSnapshot
          ? {
              offerId: offerSnapshot.offerId,
              offerTitle: offerSnapshot.offerTitle,
              offerPriceCents: offerSnapshot.offerPriceCents,
              offerCompareAtCents: offerSnapshot.offerCompareAtCents,
              offerDepositCents: offerSnapshot.offerDepositCents,
              offerValidFrom: offerSnapshot.validFrom,
              offerValidThrough: offerSnapshot.validThrough,
            }
          : {}),
        ...(proposalAttribution
          ? {
              travelProposalShareId: proposalAttribution.shareId,
              travelRequestId: proposalAttribution.travelRequestId,
              travelRequestReference: proposalAttribution.reference || null,
            }
          : {}),
        reference,
        status: "requested",
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        source: offerSnapshot
          ? "vi-guide-offer"
          : proposalAttribution
            ? "vi-guide-travel-proposal"
            : "vi-guide-web",
      });

      if (requestQuotaRef) {
        transaction.set(
          requestQuotaRef,
          {
            dayKey: getUsviToday(requestNow),
            count: requestQuotaCount + 1,
            lastSubmittedAt: now,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (offerSnapshot && offerRef && offerRecord) {
        transaction.update(offerRef, {
          ...merchantOfferDemandPatch(offerRecord, requestNow),
          serverDemandUpdatedAt: FieldValue.serverTimestamp(),
        });
      }

      if (proposalAttribution) {
        transaction.set(
          proposalAttribution.requestRef,
          {
            bookingRequestCount: FieldValue.increment(1),
            latestCommerceBookingId: bookingRef.id,
            latestCommerceBookingReference: reference,
            latestCommerceBookingStatus: "requested",
            latestBookingRequestedAt: now,
            updatedAt: now,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        transaction.set(db.collection("travelAdvisorAudit").doc(), {
          action: "booking_request_created",
          requestId: proposalAttribution.travelRequestId,
          reference: proposalAttribution.reference || null,
          proposalShareId: proposalAttribution.shareId,
          bookingId: bookingRef.id,
          bookingReference: reference,
          bookingKind: booking.kind,
          listingId: booking.listingId,
          listingName: booking.listingName,
          createdAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      }

      const notificationInputs = [
        {
          audience: "traveler" as const,
          recipientEmail: booking.email,
          title: "Booking request received",
          message: `We received your request for ${booking.listingName}. VI Guide will keep this booking status updated.`,
          href: "/bookings",
        },
        {
          audience: "merchant" as const,
          recipientEmail: null,
          title: "New booking request",
          message: `${booking.guestName} requested ${booking.listingName} for ${booking.startDate}.`,
          href: "/merchant/reservations",
        },
        {
          audience: "operations" as const,
          recipientEmail: null,
          title: proposalAttribution
            ? "Travel proposal booking request"
            : "New booking request",
          message: proposalAttribution
            ? `${booking.listingName} received booking request ${reference} from travel proposal ${proposalAttribution.reference || proposalAttribution.shareId}.`
            : `${booking.listingName} received booking request ${reference}.`,
          href: "/admin/operations",
        },
      ];
      const notificationOutboxIds: string[] = [];

      for (const input of notificationInputs) {
        const notification = normalizeBookingNotification({
          bookingId: bookingRef.id,
          reference,
          event: "booking_requested",
          audience: input.audience,
          listingId: booking.listingId,
          listingName: booking.listingName,
          recipientEmail: input.recipientEmail,
          title: input.title,
          message: input.message,
          href: input.href,
          createdAt: now,
        });
        if (!notification) {
          throw new Error("Unable to prepare booking notifications.");
        }

        notificationOutboxIds.push(notification.id);
        transaction.set(db.collection("notificationOutbox").doc(notification.id), {
          ...notification,
          serverCreatedAt: FieldValue.serverTimestamp(),
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        duplicate: false,
        bookingId: bookingRef.id,
        reference,
        status: "requested",
        offer: offerSnapshot ? offerResponse({}, offerSnapshot) : null,
        notificationOutboxIds,
        linkedToTravelRequest: Boolean(proposalAttribution),
      };
    });

    if (result.notificationOutboxIds.length > 0) {
      try {
        await processBookingNotificationOutboxIds(
          db,
          result.notificationOutboxIds,
        );
      } catch (error) {
        console.error("booking notification delivery attempt failed", error);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        duplicate: result.duplicate,
        bookingId: result.bookingId,
        reference: result.reference,
        status: result.status,
        linkedToTravelRequest: result.linkedToTravelRequest,
        ...(result.offer ?? {}),
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof CommerceBookingActionError) {
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
    console.error("commerce booking create error", error);
    return NextResponse.json(
      { error: "Unable to submit the booking request right now." },
      { status: 500 },
    );
  }
}

function normalizeBooking(
  body: Partial<CommerceBookingRequest> | null,
  now: Date = new Date(),
): CommerceBookingRequest | null {
  if (!body) return null;

  const kind = body.kind;
  const island = body.island;
  if (!isBookingKind(kind) || !isIsland(island)) return null;

  const listingId = clean(body.listingId, 160);
  const listingName = clean(body.listingName, 180);
  const offerId = normalizeMerchantOfferId(body.offerId);
  const guestName = clean(body.guestName, 160);
  const email = clean(body.email, 220).toLowerCase();
  const startDate = clean(body.startDate, 10);
  const endDate = clean(body.endDate, 10);
  const adults = Math.max(1, Math.min(20, Number(body.adults) || 1));
  const children = Math.max(0, Math.min(20, Number(body.children) || 0));
  const listingHref = safeInternalDestinationOrNull(
    clean(body.listingHref, 500) || null,
    "https://vi-guide.local",
  );
  const today = getUsviToday(now);

  if (
    !listingId ||
    !listingName ||
    !guestName ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !isBookableStartDate(startDate, today)
  ) {
    return null;
  }

  if (kind === "accommodation" && !isBookableEndDate(startDate, endDate)) {
    return null;
  }

  return {
    kind,
    listingId,
    listingName,
    island,
    startDate,
    adults,
    children,
    guestName,
    email,
    ...(offerId ? { offerId } : {}),
    ...(endDate ? { endDate } : {}),
    ...(clean(body.preferredTime, 20)
      ? { preferredTime: clean(body.preferredTime, 20) }
      : {}),
    ...(clean(body.phone, 40) ? { phone: clean(body.phone, 40) } : {}),
    ...(clean(body.notes, 1600) ? { notes: clean(body.notes, 1600) } : {}),
    ...(listingHref ? { listingHref } : {}),
  };
}

function normalizeProposalShareId(value: unknown) {
  const shareId = clean(value, 40).toLowerCase();
  return /^[a-f0-9]{24}$/.test(shareId) ? shareId : "";
}

function normalizeTravelRequestId(value: unknown) {
  const requestId = clean(value, 80);
  return /^travel_[a-f0-9]{32}$/.test(requestId) ? requestId : "";
}

function offerResponse(
  record: FirebaseFirestore.DocumentData,
  fallback: MerchantOfferBookingSnapshot,
) {
  return {
    offerId: normalizeMerchantOfferId(record.offerId) || fallback.offerId,
    offerTitle: clean(record.offerTitle, 120) || fallback.offerTitle,
    offerPriceCents: storedMoney(record.offerPriceCents, fallback.offerPriceCents),
    offerDepositCents: nullableStoredMoney(
      record.offerDepositCents,
      fallback.offerDepositCents,
    ),
  };
}

function isBookingKind(value: unknown): value is CommerceBookingKind {
  return (
    typeof value === "string" &&
    BOOKING_KINDS.includes(value as CommerceBookingKind)
  );
}

function isIsland(value: unknown): value is IntelligenceIsland {
  return (
    typeof value === "string" &&
    ISLANDS.includes(value as IntelligenceIsland)
  );
}

function storedMoney(value: unknown, fallback: number) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : fallback;
}

function nullableStoredMoney(value: unknown, fallback: number | null) {
  if (value === null) return null;
  if (value === undefined || value === "") return fallback;
  return storedMoney(value, fallback ?? 0);
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function createReference(kind: CommerceBookingKind) {
  const prefix =
    kind === "accommodation" ? "STAY" : kind === "tour" ? "TOUR" : "EXP";
  return `VI-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

class CommerceBookingActionError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 429,
  ) {
    super(message);
  }
}
