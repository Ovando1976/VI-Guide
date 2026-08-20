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
import { normalizeJourneyPlan } from "@/lib/journey-planner";
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
import {
  normalizeProposalShareId,
  proposalBookingEmailMatches,
} from "@/lib/travel-advisor-booking-handoff";
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

type AdvisorProposalAttribution = {
  shareId: string;
  travelRequestId: string;
  reference: string;
};

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking requests are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<CommerceBookingRequest>
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
      { error: "Choose a valid USVI Explorer offer." },
      { status: 400 },
    );
  }

  const rawSourceProposalShareId = clean(body.sourceProposalShareId, 40);
  const sourceProposalShareId = rawSourceProposalShareId
    ? normalizeProposalShareId(rawSourceProposalShareId)
    : "";
  if (rawSourceProposalShareId && !sourceProposalShareId) {
    return NextResponse.json(
      { error: "The USVI Explorer travel proposal link is invalid." },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  const requestNow = new Date();

  try {
    const result = await db.runTransaction(async (transaction) => {
      let offerSnapshot: MerchantOfferBookingSnapshot | null = null;
      let offerRef: FirebaseFirestore.DocumentReference | null = null;
      let offerRecord: FirebaseFirestore.DocumentData | null = null;
      let requestQuotaRef: FirebaseFirestore.DocumentReference | null = null;
      let requestQuotaCount = 0;
      let bookingInput: Partial<CommerceBookingRequest> = body;
      let advisorProposal: AdvisorProposalAttribution | null = null;
      let advisorRequestRef: FirebaseFirestore.DocumentReference | null = null;
      let advisorRequestRecord: FirebaseFirestore.DocumentData | null = null;

      if (sourceProposalShareId) {
        const proposalRef = db
          .collection("sharedJourneys")
          .doc(sourceProposalShareId);
        const proposalDocument = await transaction.get(proposalRef);
        const proposalRecord = proposalDocument.exists
          ? proposalDocument.data() ?? {}
          : null;
        const proposalPlan = normalizeJourneyPlan(proposalRecord?.plan);
        const travelRequestId = clean(proposalRecord?.travelRequestId, 80);
        const requestedListingId = clean(body.listingId, 160);
        const requestedListingName = clean(body.listingName, 180);

        if (
          !proposalRecord ||
          proposalRecord.source !== "travel_advisor_proposal" ||
          !proposalPlan ||
          !/^travel_[a-f0-9]{32}$/.test(travelRequestId)
        ) {
          throw new CommerceBookingActionError(
            "The USVI Explorer travel proposal could not be verified.",
            409,
          );
        }

        const stopMatchesProposal = proposalPlan.plan.some((stop) => {
          const stopListingId = clean(stop.placeId || stop.id, 160);
          return (
            stopListingId === requestedListingId &&
            clean(stop.title, 180) === requestedListingName
          );
        });
        if (!stopMatchesProposal) {
          throw new CommerceBookingActionError(
            "This booking request does not match the selected travel proposal.",
            409,
          );
        }

        advisorRequestRef = db
          .collection("travelPlanningRequests")
          .doc(travelRequestId);
        const advisorRequestDocument = await transaction.get(advisorRequestRef);
        advisorRequestRecord = advisorRequestDocument.exists
          ? advisorRequestDocument.data() ?? {}
          : null;
        if (!advisorRequestRecord) {
          throw new CommerceBookingActionError(
            "The related travel planning request could not be verified.",
            409,
          );
        }

        advisorProposal = {
          shareId: sourceProposalShareId,
          travelRequestId,
          reference:
            clean(proposalRecord.proposalReference, 120) ||
            clean(advisorRequestRecord.reference, 120) ||
            travelRequestId,
        };
      }

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

      const attributedAdvisorProposal =
        advisorProposal &&
        advisorRequestRecord &&
        proposalBookingEmailMatches(advisorRequestRecord.email, booking.email)
          ? advisorProposal
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

          const existingTravelRequestId = clean(data.sourceTravelRequestId, 80);
          const canLinkExisting = Boolean(
            attributedAdvisorProposal &&
              advisorRequestRef &&
              advisorRequestRecord &&
              (!existingTravelRequestId ||
                existingTravelRequestId ===
                  attributedAdvisorProposal.travelRequestId),
          );
          if (
            canLinkExisting &&
            attributedAdvisorProposal &&
            advisorRequestRef &&
            advisorRequestRecord
          ) {
            const now = requestNow.toISOString();
            transaction.set(
              bookingRef,
              {
                sourceProposalShareId: attributedAdvisorProposal.shareId,
                sourceTravelRequestId:
                  attributedAdvisorProposal.travelRequestId,
                sourceTravelAdvisorReference:
                  attributedAdvisorProposal.reference,
                updatedAt: now,
              },
              { merge: true },
            );
            transaction.update(advisorRequestRef, {
              conversionStartedAt:
                clean(advisorRequestRecord.conversionStartedAt, 50) || now,
              lastCommerceBookingId: bookingRef.id,
              lastCommerceBookingReference: reference,
              lastCommerceBookingAt:
                clean(data.createdAt, 50) || now,
              commerceBookingIds: FieldValue.arrayUnion(bookingRef.id),
              updatedAt: now,
              serverUpdatedAt: FieldValue.serverTimestamp(),
            });
            transaction.set(db.collection("travelAdvisorAudit").doc(), {
              action: "booking_request_linked_existing",
              requestId: attributedAdvisorProposal.travelRequestId,
              reference: attributedAdvisorProposal.reference,
              proposalShareId: attributedAdvisorProposal.shareId,
              commerceBookingId: bookingRef.id,
              commerceBookingReference: reference,
              listingId: booking.listingId,
              listingName: booking.listingName,
              createdAt: now,
              serverCreatedAt: FieldValue.serverTimestamp(),
            });
          }

          return {
            duplicate: true,
            bookingId: bookingRef.id,
            reference,
            status: clean(data.status, 40) || "requested",
            offer: offerResponse(data, offerSnapshot),
            notificationOutboxIds: [] as string[],
            linkedToTravelRequest: canLinkExisting,
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
        ...(advisorProposal
          ? { sourceProposalShareId: advisorProposal.shareId }
          : {}),
        ...(attributedAdvisorProposal
          ? {
              sourceTravelRequestId:
                attributedAdvisorProposal.travelRequestId,
              sourceTravelAdvisorReference:
                attributedAdvisorProposal.reference,
            }
          : {}),
        reference,
        status: "requested",
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        source: offerSnapshot
          ? "vi-guide-offer"
          : advisorProposal
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

      if (
        attributedAdvisorProposal &&
        advisorRequestRef &&
        advisorRequestRecord
      ) {
        transaction.update(advisorRequestRef, {
          conversionStartedAt:
            clean(advisorRequestRecord.conversionStartedAt, 50) || now,
          lastCommerceBookingId: bookingRef.id,
          lastCommerceBookingReference: reference,
          lastCommerceBookingAt: now,
          commerceBookingIds: FieldValue.arrayUnion(bookingRef.id),
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(db.collection("travelAdvisorAudit").doc(), {
          action: "booking_request_started",
          requestId: attributedAdvisorProposal.travelRequestId,
          reference: attributedAdvisorProposal.reference,
          proposalShareId: attributedAdvisorProposal.shareId,
          commerceBookingId: bookingRef.id,
          commerceBookingReference: reference,
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
          message: `We received your request for ${booking.listingName}. USVI Explorer will keep this booking status updated.`,
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
          title: advisorProposal
            ? "Travel proposal booking request"
            : "New booking request",
          message: advisorProposal
            ? `${booking.listingName} received booking request ${reference} from a USVI Explorer travel proposal.`
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
        linkedToTravelRequest: Boolean(attributedAdvisorProposal),
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
  const sourceProposalShareId = normalizeProposalShareId(
    body.sourceProposalShareId,
  );
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
    ...(sourceProposalShareId ? { sourceProposalShareId } : {}),
    ...(endDate ? { endDate } : {}),
    ...(clean(body.preferredTime, 20)
      ? { preferredTime: clean(body.preferredTime, 20) }
      : {}),
    ...(clean(body.phone, 40) ? { phone: clean(body.phone, 40) } : {}),
    ...(clean(body.notes, 1600) ? { notes: clean(body.notes, 1600) } : {}),
    ...(listingHref ? { listingHref } : {}),
  };
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
    public status: 400 | 409 | 429,
  ) {
    super(message);
  }
}
