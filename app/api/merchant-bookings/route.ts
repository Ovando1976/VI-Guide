import { NextRequest, NextResponse } from "next/server";

import {
  AuthError,
  authErrorResponse,
  requireSession,
} from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  canManageListing,
  managedListingIdsForSession,
} from "@/lib/merchant-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MERCHANT_ROLES = ["admin", "dispatcher", "merchant"] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession([...MERCHANT_ROLES]);

    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant bookings are not configured on the server." },
        { status: 503 },
      );
    }

    const listingId = clean(request.nextUrl.searchParams.get("listingId"), 160);
    if (listingId && !canManageListing(session, listingId)) {
      throw new AuthError(
        "You do not have permission to view bookings for this listing.",
        403,
      );
    }

    const documents = await loadBookingDocuments(session, listingId);
    const bookings = documents.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        reference: String(data.reference ?? ""),
        status: String(data.status ?? "requested"),
        kind: String(data.kind ?? "experience"),
        listingId: String(data.listingId ?? ""),
        listingName: String(data.listingName ?? "VI Guide booking"),
        offerId: data.offerId ? String(data.offerId) : null,
        offerTitle: data.offerTitle ? String(data.offerTitle) : null,
        offerPriceCents: nullableMoney(data.offerPriceCents),
        offerCompareAtCents: nullableMoney(data.offerCompareAtCents),
        offerDepositCents: nullableMoney(data.offerDepositCents),
        offerValidFrom: data.offerValidFrom
          ? String(data.offerValidFrom)
          : null,
        offerValidThrough: data.offerValidThrough
          ? String(data.offerValidThrough)
          : null,
        island: String(data.island ?? "stt"),
        startDate: String(data.startDate ?? ""),
        endDate: data.endDate ? String(data.endDate) : null,
        preferredTime: data.preferredTime ? String(data.preferredTime) : null,
        adults: Number(data.adults ?? 1),
        children: Number(data.children ?? 0),
        guestName: String(data.guestName ?? "Guest"),
        email: String(data.email ?? ""),
        phone: data.phone ? String(data.phone) : null,
        notes: data.notes ? String(data.notes) : null,
        merchantNote: data.merchantNote ? String(data.merchantNote) : null,
        proposedTime: data.proposedTime ? String(data.proposedTime) : null,
        depositAmountCents: nullableMoney(data.depositAmountCents),
        paidAmountCents: nullableMoney(data.paidAmountCents),
        paymentStatus: data.paymentStatus
          ? String(data.paymentStatus)
          : "unpaid",
        checkoutSessionId: data.checkoutSessionId
          ? String(data.checkoutSessionId)
          : null,
        paymentIntentId: data.paymentIntentId
          ? String(data.paymentIntentId)
          : null,
        paidAt: data.paidAt ? String(data.paidAt) : null,
        createdAt: String(data.createdAt ?? ""),
        updatedAt: String(data.updatedAt ?? data.createdAt ?? ""),
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant bookings list error", error);
    return NextResponse.json(
      { error: "Unable to load merchant bookings." },
      { status: 500 },
    );
  }
}

async function loadBookingDocuments(
  session: Awaited<ReturnType<typeof requireSession>>,
  requestedListingId: string,
) {
  const collection = getAdminDb().collection("commerceBookings");

  if (requestedListingId) {
    const snapshot = await collection
      .where("listingId", "==", requestedListingId)
      .limit(100)
      .get();
    return sortDocuments(snapshot.docs);
  }

  if (session.role !== "merchant") {
    const snapshot = await collection
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return snapshot.docs;
  }

  const listingIds = managedListingIdsForSession(session);
  if (!listingIds.length) return [];

  const snapshots = await Promise.all(
    listingIds.map((managedListingId) =>
      collection
        .where("listingId", "==", managedListingId)
        .limit(100)
        .get(),
    ),
  );
  const unique = new Map(
    snapshots
      .flatMap((snapshot) => snapshot.docs)
      .map((document) => [document.id, document] as const),
  );

  return sortDocuments(Array.from(unique.values())).slice(0, 100);
}

function sortDocuments<
  T extends {
    data(): FirebaseFirestore.DocumentData;
  },
>(documents: T[]) {
  return [...documents].sort((left, right) => {
    const leftData = left.data();
    const rightData = right.data();
    return String(rightData.createdAt ?? "").localeCompare(
      String(leftData.createdAt ?? ""),
    );
  });
}

function nullableMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
