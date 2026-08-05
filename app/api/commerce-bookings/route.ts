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
import { normalizeMerchantOfferId } from "@/lib/merchant-offers";
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
      { error: "Please complete the required booking information with future travel dates." },
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

  const db = getAdminDb();
  const bookingRef = db.collection("commerceBookings").doc();

  try {
    const result = await db.runTransaction(async (transaction) => {
      let offerSnapshot: MerchantOfferBookingSnapshot | null = null;
      let bookingInput: Partial<CommerceBookingRequest> = body;

      if (offerId) {
        const offerRef = db.collection("merchantOffers").doc(offerId);
        const offerDocument = await transaction.get(offerRef);
        const resolution = resolveMerchantOfferForBooking({
          offerId,
          record: offerDocument.exists ? offerDocument.data() ?? {} : null,
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

      const booking = normalizeBooking(bookingInput);
      if (!booking) {
        throw new CommerceBookingActionError(
          "Please complete the required booking information with future travel dates.",
          400,
        );
      }

      const reference = createReference(booking.kind);
      const now = new Date().toISOString();
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
        reference,
        status: "requested",
        createdAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        source: offerSnapshot ? "vi-guide-offer" : "vi-guide-web",
      });

      return { reference, offerSnapshot };
    });

    return NextResponse.json(
      {
        ok: true,
        bookingId: bookingRef.id,
        reference: result.reference,
        status: "requested",
        ...(result.offerSnapshot
          ? {
              offerId: result.offerSnapshot.offerId,
              offerTitle: result.offerSnapshot.offerTitle,
              offerPriceCents: result.offerSnapshot.offerPriceCents,
              offerDepositCents: result.offerSnapshot.offerDepositCents,
            }
          : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CommerceBookingActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
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
  const today = getUsviToday();

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

function isBookingKind(value: unknown): value is CommerceBookingKind {
  return typeof value === "string" &&
    BOOKING_KINDS.includes(value as CommerceBookingKind);
}

function isIsland(value: unknown): value is IntelligenceIsland {
  return typeof value === "string" &&
    ISLANDS.includes(value as IntelligenceIsland);
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
    readonly status: 400 | 404 | 409,
  ) {
    super(message);
  }
}
