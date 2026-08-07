import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Traveler Plus is not configured on the server." },
        { status: 503 },
      );
    }

    const snapshot = await getAdminDb()
      .collection("travelerMemberships")
      .doc(session.uid)
      .get();
    const customerId = clean(snapshot.data()?.stripeCustomerId, 220);
    if (!customerId) {
      return NextResponse.json(
        { error: "No Traveler Plus billing profile is attached to this account." },
        { status: 409 },
      );
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${request.nextUrl.origin}/plus`,
    });

    return NextResponse.json({ portalUrl: portal.url });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("traveler plus portal error", error);
    return NextResponse.json(
      { error: "Unable to open Traveler Plus billing management." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
