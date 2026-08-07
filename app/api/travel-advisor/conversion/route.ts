import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  serializeAdvisorCommerceBooking,
  summarizeTravelAdvisorBookings,
  type AdvisorCommerceBooking,
} from "@/lib/travel-advisor-commerce";
import {
  summarizeTravelAdvisorFunnel,
  travelAdvisorConversionLabel,
  travelAdvisorConversionStage,
  travelAdvisorNextAction,
} from "@/lib/travel-advisor-conversion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Travel Advisor conversion reporting is not configured." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const requestSnapshot = await db
      .collection("travelPlanningRequests")
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();

    const bookingToRequest = new Map<string, string>();
    for (const document of requestSnapshot.docs) {
      const data = document.data();
      for (const bookingId of [
        ...cleanArray(data.commerceBookingIds),
        clean(data.lastCommerceBookingId, 180),
      ]) {
        if (bookingId) bookingToRequest.set(bookingId, document.id);
      }
    }

    const bookingsByRequest = new Map<string, AdvisorCommerceBooking[]>();
    const bookingIds = Array.from(bookingToRequest.keys());
    if (bookingIds.length) {
      const refs = bookingIds.map((bookingId) =>
        db.collection("commerceBookings").doc(bookingId),
      );
      const bookingDocuments = await db.getAll(...refs);
      for (const document of bookingDocuments) {
        if (!document.exists) continue;
        const expectedRequestId = bookingToRequest.get(document.id);
        if (!expectedRequestId) continue;
        const data = document.data() ?? {};
        if (clean(data.sourceTravelRequestId, 80) !== expectedRequestId) continue;
        const booking = serializeAdvisorCommerceBooking(document.id, data);
        const current = bookingsByRequest.get(expectedRequestId) ?? [];
        current.push(booking);
        bookingsByRequest.set(expectedRequestId, current);
      }
    }

    const requests = requestSnapshot.docs.map((document) => {
      const data = document.data();
      const commerceBookings = (bookingsByRequest.get(document.id) ?? []).sort(
        (left, right) => right.updatedAt.localeCompare(left.updatedAt),
      );
      const commerceSummary = summarizeTravelAdvisorBookings(commerceBookings);
      const proposalSentAt = clean(data.proposalSentAt, 50) || null;
      const status = clean(data.status, 40) || "new";
      const stage = travelAdvisorConversionStage({
        status,
        proposalSentAt,
        commerceBookings,
        commerceSummary,
      });

      return {
        id: document.id,
        reference: clean(data.reference, 120) || document.id,
        travelerName: clean(data.travelerName, 140) || "Traveler",
        status,
        createdAt: clean(data.createdAt, 50),
        updatedAt: clean(data.updatedAt, 50),
        proposalSentAt,
        proposalHref: safeInternalHref(data.proposalHref),
        conversionStartedAt: clean(data.conversionStartedAt, 50) || null,
        commerceBookings,
        commerceSummary,
        conversionStage: stage,
        conversionStageLabel: travelAdvisorConversionLabel(stage),
        nextAction: travelAdvisorNextAction(stage),
      };
    });

    return NextResponse.json({
      ok: true,
      funnel: summarizeTravelAdvisorFunnel(requests),
      requests,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("travel advisor conversion report error", error);
    return NextResponse.json(
      { error: "Unable to load Travel Advisor conversion reporting." },
      { status: 500 },
    );
  }
}

function cleanArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => clean(entry, 180)).filter(Boolean).slice(0, 100)
    : [];
}

function safeInternalHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
