import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { merchantOfferListingAllowed } from "@/lib/merchant-offers";
import {
  merchantOfferDemandSummary,
  normalizeMerchantOfferLastRequestedAt,
  normalizeMerchantOfferRequestCount,
} from "@/lib/merchant-offer-demand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession(["merchant", "dispatcher", "admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant offer demand is not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("merchantOffers")
      .orderBy("updatedAt", "desc")
      .limit(250)
      .get();
    const offers = snapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          listingId: clean(data.listingId, 160),
          listingName: clean(data.listingName, 180) || "USVI Explorer business",
          title: clean(data.title, 120) || "Untitled offer",
          status: clean(data.status, 40) || "draft",
          requestCount: normalizeMerchantOfferRequestCount(data.requestCount),
          lastRequestedAt: normalizeMerchantOfferLastRequestedAt(
            data.lastRequestedAt,
          ),
        };
      })
      .filter((offer) =>
        session.role === "merchant"
          ? merchantOfferListingAllowed({
              role: session.role,
              listingIds: session.listingIds,
              listingId: offer.listingId,
            })
          : true,
      );
    const summary = merchantOfferDemandSummary(offers);
    const topOffers = [...offers]
      .filter((offer) => offer.requestCount > 0)
      .sort((left, right) => {
        if (right.requestCount !== left.requestCount) {
          return right.requestCount - left.requestCount;
        }
        return String(right.lastRequestedAt ?? "").localeCompare(
          String(left.lastRequestedAt ?? ""),
        );
      })
      .slice(0, 10);

    return NextResponse.json({
      summary,
      topOffers,
      latestRequestedAt:
        topOffers
          .map((offer) => offer.lastRequestedAt)
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => right.localeCompare(left))[0] ?? null,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant offer demand error", error);
    return NextResponse.json(
      { error: "Unable to load merchant offer demand." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
