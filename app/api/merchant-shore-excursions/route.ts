import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  resolveMerchantOfferForBooking,
  type MerchantOfferBookingSnapshot,
} from "@/lib/merchant-offer-booking";
import { merchantOfferListingAllowed } from "@/lib/merchant-offers";
import {
  canTransitionShoreExcursion,
  normalizeShoreExcursionProfile,
  normalizeShoreExcursionStatus,
  type ShoreExcursionStatus,
} from "@/lib/shore-excursions";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["merchant", "dispatcher", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Shore excursions are not configured on the server." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const [profileSnapshot, offerSnapshot] = await Promise.all([
      db.collection("shoreExcursions").orderBy("updatedAt", "desc").limit(250).get(),
      db.collection("merchantOffers").orderBy("updatedAt", "desc").limit(250).get(),
    ]);

    const offers = offerSnapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          listingId: clean(data.listingId, 160),
          listingName: clean(data.listingName, 180),
          kind: clean(data.kind, 40),
          island: clean(data.island, 20),
          title: clean(data.title, 120),
          status: clean(data.status, 40),
          validFrom: clean(data.validFrom, 10),
          validThrough: clean(data.validThrough, 10),
        };
      })
      .filter(
        (offer) =>
          (offer.kind === "tour" || offer.kind === "experience") &&
          (session.role !== "merchant" ||
            merchantOfferListingAllowed({
              role: session.role,
              listingIds: session.listingIds,
              listingId: offer.listingId,
            })),
      );

    const allowedOfferIds = new Set(offers.map((offer) => offer.id));
    const profiles = profileSnapshot.docs
      .filter((document) => allowedOfferIds.has(document.id))
      .map((document) => serializeProfile(document.id, document.data()));

    return NextResponse.json({
      canManage: session.role === "merchant" || session.role === "admin",
      offers,
      profiles,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant shore excursion list error", error);
    return NextResponse.json(
      { error: "Unable to load shore excursion operations." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["merchant", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Shore excursions are not configured on the server." },
        { status: 503 },
      );
    }
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const offerId = clean(body?.offerId, 160);
    if (!offerId) {
      return NextResponse.json({ error: "Choose an offer." }, { status: 400 });
    }

    const db = getAdminDb();
    const offerDocument = await db.collection("merchantOffers").doc(offerId).get();
    const offer = resolveEditableOffer(offerId, offerDocument.data() ?? null);
    if (!offer) {
      return NextResponse.json(
        { error: "Choose an active or scheduled tour/experience offer." },
        { status: 409 },
      );
    }
    if (
      !merchantOfferListingAllowed({
        role: session.role,
        listingIds: session.listingIds,
        listingId: offer.listingId,
      })
    ) {
      return NextResponse.json(
        { error: "You cannot manage excursions for this listing." },
        { status: 403 },
      );
    }

    const validation = normalizeShoreExcursionProfile({
      profile: body ?? {},
      offer,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const profileRef = db.collection("shoreExcursions").doc(offer.offerId);
    if ((await profileRef.get()).exists) {
      return NextResponse.json(
        { error: "This offer already has a shore excursion profile." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const auditRef = db.collection("shoreExcursionAudit").doc();
    const batch = db.batch();
    batch.set(profileRef, {
      ...validation.profile,
      listingId: offer.listingId,
      listingName: offer.listingName,
      offerTitle: offer.offerTitle,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdByUid: session.uid,
      createdByEmail: session.email ?? null,
      serverCreatedAt: FieldValue.serverTimestamp(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(auditRef, {
      action: "shore_excursion_created",
      offerId: offer.offerId,
      listingId: offer.listingId,
      actorUid: session.uid,
      actorEmail: session.email ?? null,
      createdAt: now,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json(
      {
        ok: true,
        profile: serializeProfile(offer.offerId, {
          ...validation.profile,
          listingId: offer.listingId,
          listingName: offer.listingName,
          offerTitle: offer.offerTitle,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant shore excursion create error", error);
    return NextResponse.json(
      { error: "Unable to create the shore excursion profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["merchant", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Shore excursions are not configured on the server." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          offerId?: unknown;
          status?: unknown;
          profile?: Record<string, unknown>;
        }
      | null;
    const offerId = clean(body?.offerId, 160);
    const requestedStatus = body?.status
      ? normalizeShoreExcursionStatus(body.status)
      : null;
    if (!offerId || (body?.status && !requestedStatus)) {
      return NextResponse.json(
        { error: "Choose a valid excursion and action." },
        { status: 400 },
      );
    }
    if (!requestedStatus && !body?.profile) {
      return NextResponse.json(
        { error: "Submit profile changes or a lifecycle status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const profileRef = db.collection("shoreExcursions").doc(offerId);
    const offerRef = db.collection("merchantOffers").doc(offerId);
    const now = new Date();

    const updated = await db.runTransaction(async (transaction) => {
      const [profileDocument, offerDocument] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(offerRef),
      ]);
      if (!profileDocument.exists) {
        throw new ShoreExcursionActionError("Shore excursion not found.", 404);
      }
      const profileData = profileDocument.data() ?? {};
      const offer = resolveEditableOffer(offerId, offerDocument.data() ?? null);
      if (!offer) {
        throw new ShoreExcursionActionError(
          "The linked offer is no longer eligible for shore excursions.",
          409,
        );
      }
      if (
        !merchantOfferListingAllowed({
          role: session.role,
          listingIds: session.listingIds,
          listingId: offer.listingId,
        })
      ) {
        throw new ShoreExcursionActionError(
          "You cannot manage excursions for this listing.",
          403,
        );
      }

      const currentStatus =
        normalizeShoreExcursionStatus(profileData.status) ?? "draft";
      let nextStatus = currentStatus;
      let patch: Record<string, unknown> = {};
      let action = "shore_excursion_updated";

      if (body?.profile) {
        if (currentStatus === "active") {
          throw new ShoreExcursionActionError(
            "Pause a live shore excursion before changing its operating details.",
            409,
          );
        }
        if (currentStatus === "archived") {
          throw new ShoreExcursionActionError(
            "Archived shore excursions cannot be edited.",
            409,
          );
        }
        const validation = normalizeShoreExcursionProfile({
          profile: { ...profileData, ...body.profile, offerId },
          offer,
        });
        if (!validation.ok) {
          throw new ShoreExcursionActionError(validation.error, 400);
        }
        patch = {
          ...validation.profile,
          listingId: offer.listingId,
          listingName: offer.listingName,
          offerTitle: offer.offerTitle,
        };
      }

      if (requestedStatus && requestedStatus !== currentStatus) {
        if (!canTransitionShoreExcursion(currentStatus, requestedStatus)) {
          throw new ShoreExcursionActionError(
            `A ${currentStatus} shore excursion cannot move to ${requestedStatus}.`,
            409,
          );
        }
        nextStatus = requestedStatus;
        patch = { ...patch, status: requestedStatus };
        action = `shore_excursion_${requestedStatus}`;
      }

      if (requestedStatus === "active") {
        const validation = normalizeShoreExcursionProfile({
          profile: { ...profileData, ...patch, offerId },
          offer,
        });
        if (!validation.ok) {
          throw new ShoreExcursionActionError(validation.error, 409);
        }
        patch = {
          ...validation.profile,
          listingId: offer.listingId,
          listingName: offer.listingName,
          offerTitle: offer.offerTitle,
          status: "active",
        };
      }

      const nowIso = now.toISOString();
      transaction.update(profileRef, {
        ...patch,
        updatedAt: nowIso,
        updatedByUid: session.uid,
        updatedByEmail: session.email ?? null,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("shoreExcursionAudit").doc(), {
        action,
        offerId,
        listingId: offer.listingId,
        previousStatus: currentStatus,
        nextStatus,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: nowIso,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeProfile(offerId, {
        ...profileData,
        ...patch,
        updatedAt: nowIso,
      });
    });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (error) {
    if (error instanceof ShoreExcursionActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant shore excursion update error", error);
    return NextResponse.json(
      { error: "Unable to update the shore excursion profile." },
      { status: 500 },
    );
  }
}

function resolveEditableOffer(
  offerId: string,
  data: FirebaseFirestore.DocumentData | null,
): MerchantOfferBookingSnapshot | null {
  if (!data) return null;
  const strict = resolveMerchantOfferForBooking({ offerId, record: data });
  if (strict.ok) return strict.snapshot;

  const kind = clean(data.kind, 40);
  const island = clean(data.island, 20);
  const listingId = clean(data.listingId, 160);
  const listingName = clean(data.listingName, 180);
  const offerTitle = clean(data.title, 120);
  const status = clean(data.status, 40);
  const priceCents = Number(data.priceCents);
  if (
    (kind !== "tour" && kind !== "experience") ||
    !["stt", "stj", "stx"].includes(island) ||
    !listingId ||
    !listingName ||
    !offerTitle ||
    !["draft", "active", "paused"].includes(status) ||
    !Number.isInteger(priceCents) ||
    priceCents < 0
  ) {
    return null;
  }

  return {
    offerId,
    offerTitle,
    offerPriceCents: priceCents,
    offerCompareAtCents: nullableMoney(data.compareAtCents),
    offerDepositCents: nullableMoney(data.depositCents),
    listingId,
    listingName,
    kind: kind as "tour" | "experience",
    island: island as "stt" | "stj" | "stx",
    validFrom: clean(data.validFrom, 10),
    validThrough: clean(data.validThrough, 10),
  };
}

function serializeProfile(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    offerId: id,
    listingId: clean(data.listingId, 160),
    listingName: clean(data.listingName, 180),
    offerTitle: clean(data.offerTitle, 120),
    island: clean(data.island, 20),
    supportedPorts: Array.isArray(data.supportedPorts)
      ? data.supportedPorts.filter((value): value is string => typeof value === "string")
      : [],
    meetingPoint: clean(data.meetingPoint, 240),
    durationMinutes: storedInteger(data.durationMinutes),
    minReturnBufferMinutes: storedInteger(data.minReturnBufferMinutes),
    pickupIncluded: data.pickupIncluded === true,
    maxGuests: storedInteger(data.maxGuests),
    mobilityNotes: cleanMultiline(data.mobilityNotes, 1200) || null,
    accessibilityNotes: cleanMultiline(data.accessibilityNotes, 1200) || null,
    status: normalizeShoreExcursionStatus(data.status) ?? "draft",
    createdAt: normalizeTimestampOrEpoch(data.createdAt ?? data.serverCreatedAt),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.createdAt ?? data.serverUpdatedAt,
    ),
  };
}

function storedInteger(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : 0;
}

function nullableMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : null;
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

class ShoreExcursionActionError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 403 | 404 | 409,
  ) {
    super(message);
  }
}
