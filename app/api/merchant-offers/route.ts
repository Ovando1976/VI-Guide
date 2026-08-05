import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  canTransitionMerchantOffer,
  merchantOfferListingAllowed,
  merchantOfferPublicState,
  normalizeMerchantOffer,
  normalizeMerchantOfferId,
  normalizeMerchantOfferStatus,
  type MerchantOfferStatus,
} from "@/lib/merchant-offers";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["merchant", "dispatcher", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant offers are not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("merchantOffers")
      .orderBy("updatedAt", "desc")
      .limit(250)
      .get();
    const offers = snapshot.docs
      .map((document) => serializeOffer(document.id, document.data()))
      .filter((offer) =>
        session.role === "merchant"
          ? merchantOfferListingAllowed({
              role: session.role,
              listingIds: session.listingIds,
              listingId: offer.listingId,
            })
          : true,
      );

    return NextResponse.json({
      canManage: session.role === "merchant" || session.role === "admin",
      listingIds: session.role === "merchant" ? session.listingIds ?? [] : [],
      summary: summarizeOffers(offers),
      offers,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant offer list error", error);
    return NextResponse.json(
      { error: "Unable to load merchant offers." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["merchant", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant offers are not configured on the server." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const validation = normalizeMerchantOffer(body ?? {});
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    if (
      !merchantOfferListingAllowed({
        role: session.role,
        listingIds: session.listingIds,
        listingId: validation.offer.listingId,
      })
    ) {
      return NextResponse.json(
        { error: "You cannot create offers for this listing." },
        { status: 403 },
      );
    }

    const db = getAdminDb();
    const offerRef = db.collection("merchantOffers").doc();
    const auditRef = db.collection("merchantOfferAudit").doc();
    const now = new Date().toISOString();
    const batch = db.batch();
    batch.set(offerRef, {
      ...validation.offer,
      status: "draft",
      createdByUid: session.uid,
      createdByEmail: session.email ?? null,
      createdAt: now,
      updatedAt: now,
      serverCreatedAt: FieldValue.serverTimestamp(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(auditRef, {
      action: "offer_created",
      offerId: offerRef.id,
      listingId: validation.offer.listingId,
      status: "draft",
      actorUid: session.uid,
      actorEmail: session.email ?? null,
      createdAt: now,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json(
      {
        ok: true,
        offer: serializeOffer(offerRef.id, {
          ...validation.offer,
          status: "draft",
          createdByUid: session.uid,
          createdByEmail: session.email ?? null,
          createdAt: now,
          updatedAt: now,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant offer create error", error);
    return NextResponse.json(
      { error: "Unable to create the merchant offer." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(["merchant", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant offers are not configured on the server." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          id?: unknown;
          status?: unknown;
          offer?: Record<string, unknown>;
        }
      | null;
    const offerId = normalizeMerchantOfferId(body?.id);
    const requestedStatus = body?.status
      ? normalizeMerchantOfferStatus(body.status)
      : null;
    if (!offerId || (body?.status && !requestedStatus)) {
      return NextResponse.json(
        { error: "Choose a valid offer and action." },
        { status: 400 },
      );
    }
    if (!requestedStatus && !body?.offer) {
      return NextResponse.json(
        { error: "Submit offer details or a lifecycle status." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const offerRef = db.collection("merchantOffers").doc(offerId);
    const now = new Date();
    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(offerRef);
      if (!snapshot.exists) {
        throw new MerchantOfferActionError("Merchant offer not found.", 404);
      }

      const data = snapshot.data() ?? {};
      const currentStatus = normalizeMerchantOfferStatus(data.status) ?? "draft";
      if (
        !merchantOfferListingAllowed({
          role: session.role,
          listingIds: session.listingIds,
          listingId: data.listingId,
        })
      ) {
        throw new MerchantOfferActionError(
          "You cannot manage offers for this listing.",
          403,
        );
      }

      let patch: Record<string, unknown> = {};
      let action = "offer_updated";
      let nextStatus = currentStatus;

      if (body?.offer) {
        if (currentStatus === "active") {
          throw new MerchantOfferActionError(
            "Pause a live offer before changing its price or details.",
            409,
          );
        }
        if (currentStatus === "archived") {
          throw new MerchantOfferActionError(
            "Archived offers cannot be edited.",
            409,
          );
        }
        const validation = normalizeMerchantOffer(
          {
            ...body.offer,
            listingId: data.listingId,
          },
          now,
          { allowStarted: true },
        );
        if (!validation.ok) {
          throw new MerchantOfferActionError(validation.error, 400);
        }
        if (
          !merchantOfferListingAllowed({
            role: session.role,
            listingIds: session.listingIds,
            listingId: validation.offer.listingId,
          })
        ) {
          throw new MerchantOfferActionError(
            "You cannot move this offer to another listing.",
            403,
          );
        }
        patch = validation.offer;
      }

      if (requestedStatus && requestedStatus !== currentStatus) {
        if (!canTransitionMerchantOffer(currentStatus, requestedStatus)) {
          throw new MerchantOfferActionError(
            `A ${currentStatus} offer cannot move to ${requestedStatus}.`,
            409,
          );
        }
        nextStatus = requestedStatus;
        patch = { ...patch, status: requestedStatus };
        action = `offer_${requestedStatus}`;
      }

      if (requestedStatus === "active") {
        const publication = normalizeMerchantOffer(
          {
            ...data,
            ...patch,
            listingId: data.listingId,
          },
          now,
          { allowStarted: true },
        );
        if (!publication.ok) {
          throw new MerchantOfferActionError(publication.error, 409);
        }
        patch = {
          ...publication.offer,
          ...patch,
          status: "active",
        };
      }

      const nowIso = now.toISOString();
      transaction.update(offerRef, {
        ...patch,
        updatedAt: nowIso,
        updatedByUid: session.uid,
        updatedByEmail: session.email ?? null,
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("merchantOfferAudit").doc(), {
        action,
        offerId,
        listingId: String(data.listingId ?? ""),
        previousStatus: currentStatus,
        nextStatus,
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        createdAt: nowIso,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });

      return serializeOffer(offerId, {
        ...data,
        ...patch,
        updatedAt: nowIso,
        updatedByUid: session.uid,
        updatedByEmail: session.email ?? null,
      });
    });

    return NextResponse.json({ ok: true, offer: updated });
  } catch (error) {
    if (error instanceof MerchantOfferActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant offer update error", error);
    return NextResponse.json(
      { error: "Unable to update the merchant offer." },
      { status: 500 },
    );
  }
}

function serializeOffer(id: string, data: FirebaseFirestore.DocumentData) {
  const status = normalizeMerchantOfferStatus(data.status) ?? "draft";
  return {
    id,
    listingId: clean(data.listingId, 160),
    listingName: clean(data.listingName, 180),
    kind: clean(data.kind, 40),
    island: clean(data.island, 20),
    title: clean(data.title, 120),
    summary: cleanMultiline(data.summary, 700),
    inclusions: cleanMultiline(data.inclusions, 1400) || null,
    terms: cleanMultiline(data.terms, 1400) || null,
    priceCents: normalizeStoredMoney(data.priceCents),
    compareAtCents: nullableStoredMoney(data.compareAtCents),
    depositCents: nullableStoredMoney(data.depositCents),
    validFrom: clean(data.validFrom, 10),
    validThrough: clean(data.validThrough, 10),
    status,
    publicState: merchantOfferPublicState({
      status,
      validFrom: data.validFrom,
      validThrough: data.validThrough,
    }),
    createdByUid: clean(data.createdByUid, 160) || null,
    createdByEmail: clean(data.createdByEmail, 220) || null,
    createdAt: normalizeTimestampOrEpoch(
      data.createdAt ?? data.serverCreatedAt,
    ),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.createdAt ?? data.serverUpdatedAt,
    ),
  };
}

function summarizeOffers(
  offers: Array<ReturnType<typeof serializeOffer>>,
) {
  return offers.reduce(
    (summary, offer) => {
      summary.total += 1;
      summary[offer.status] += 1;
      if (offer.publicState === "live") summary.live += 1;
      if (offer.publicState === "scheduled") summary.scheduled += 1;
      if (offer.publicState === "expired") summary.expired += 1;
      return summary;
    },
    {
      total: 0,
      draft: 0,
      active: 0,
      paused: 0,
      archived: 0,
      live: 0,
      scheduled: 0,
      expired: 0,
    } as Record<
      MerchantOfferStatus | "total" | "live" | "scheduled" | "expired",
      number
    >,
  );
}

function normalizeStoredMoney(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : 0;
}

function nullableStoredMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return normalizeStoredMoney(value);
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

class MerchantOfferActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
