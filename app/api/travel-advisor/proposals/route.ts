import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizeTravelRequestStatus } from "@/lib/travel-advisor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Travel advisor proposals are not configured." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const snapshot = await db
      .collection("travelPlanningRequests")
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();
    const records = snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
    const latestBookingIds = Array.from(
      new Set(
        records
          .map(({ data }) => clean(data.lastCommerceBookingId, 160))
          .filter(Boolean),
      ),
    );
    const bookingSnapshots = latestBookingIds.length
      ? await db.getAll(
          ...latestBookingIds.map((bookingId) =>
            db.collection("commerceBookings").doc(bookingId),
          ),
        )
      : [];
    const liveBookings = new Map(
      bookingSnapshots
        .filter((document) => document.exists)
        .map((document) => [document.id, document.data() ?? {}] as const),
    );

    return NextResponse.json(
      {
        ok: true,
        requests: records.map(({ id, data }) => {
          const latestCommerceBookingId =
            clean(data.lastCommerceBookingId, 160) || null;
          const liveBooking = latestCommerceBookingId
            ? liveBookings.get(latestCommerceBookingId) ?? null
            : null;
          const commerceBookingIds = cleanArray(data.commerceBookingIds, 160);

          return {
            id,
            reference: clean(data.reference, 120),
            travelerName: clean(data.travelerName, 140),
            email: clean(data.email, 220),
            island: clean(data.island, 40),
            arrival: clean(data.arrival, 10) || null,
            departure: clean(data.departure, 10) || null,
            travelers: safeInteger(data.travelers),
            status: normalizeTravelRequestStatus(data.status) ?? "new",
            proposalShareId: clean(data.proposalShareId, 40) || null,
            proposalHref: clean(data.proposalHref, 500) || null,
            proposalVersion: safeInteger(data.proposalVersion),
            proposalPlanId: clean(data.proposalPlanId, 160) || null,
            proposalTitle: clean(data.proposalTitle, 120) || null,
            proposalPublishedAt: clean(data.proposalPublishedAt, 50) || null,
            proposalSentAt: clean(data.proposalSentAt, 50) || null,
            conversionStartedAt: clean(data.conversionStartedAt, 50) || null,
            bookingRequestCount: commerceBookingIds.length,
            latestCommerceBookingId,
            latestCommerceBookingReference:
              clean(liveBooking?.reference, 160) ||
              clean(data.lastCommerceBookingReference, 160) ||
              null,
            latestCommerceBookingStatus:
              clean(liveBooking?.status, 40) ||
              clean(data.latestCommerceBookingStatus, 40) ||
              null,
            latestCommercePaymentStatus:
              clean(liveBooking?.paymentStatus, 40) || null,
            latestCommerceBookingUpdatedAt:
              clean(liveBooking?.updatedAt, 50) ||
              clean(data.latestCommerceBookingUpdatedAt, 50) ||
              clean(data.lastCommerceBookingAt, 50) ||
              null,
            createdAt: clean(data.createdAt, 50),
            updatedAt: clean(data.updatedAt, 50),
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("travel advisor proposal queue error", error);
    return NextResponse.json(
      { error: "Unable to load travel advisor proposals." },
      { status: 500 },
    );
  }
}

function cleanArray(value: unknown, maxLength: number) {
  return Array.isArray(value)
    ? value
        .map((entry) => clean(entry, maxLength))
        .filter(Boolean)
        .slice(0, 150)
    : [];
}

function safeInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
