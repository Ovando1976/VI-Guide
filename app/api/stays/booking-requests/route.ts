import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAccommodationBySlug } from "@/lib/accommodations";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

type RequestBody = { staySlug?: string; checkIn?: string; checkOut?: string; adults?: number; children?: number; rooms?: number; phone?: string; notes?: string };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["rider", "admin", "dispatcher"]);
    if (!hasFirebaseAdminConfiguration()) return NextResponse.json({ error: "Stay requests are not configured." }, { status: 503 });
    const body = (await request.json()) as RequestBody;
    const stay = body.staySlug ? getAccommodationBySlug(body.staySlug) : null;
    if (!stay) return NextResponse.json({ error: "Unknown accommodation." }, { status: 400 });
    if (!body.checkIn || !body.checkOut || !DATE.test(body.checkIn) || !DATE.test(body.checkOut) || body.checkOut <= body.checkIn) return NextResponse.json({ error: "Choose valid check-in and check-out dates." }, { status: 400 });
    const adults = Math.max(1, Math.min(12, Number(body.adults || 1)));
    const children = Math.max(0, Math.min(12, Number(body.children || 0)));
    const rooms = Math.max(1, Math.min(8, Number(body.rooms || 1)));
    const ref = getAdminDb().collection("stayBookingRequests").doc();
    await ref.set({
      requestId: ref.id,
      riderId: session.uid,
      riderEmail: session.email || null,
      staySlug: stay.slug,
      stayName: stay.name,
      island: stay.island.toUpperCase(),
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      adults,
      children,
      rooms,
      phone: String(body.phone || "").trim().slice(0, 40),
      notes: String(body.notes || "").trim().slice(0, 1000),
      status: "pending_property_confirmation",
      pricingStatus: "not_quoted",
      paymentStatus: "not_requested",
      propertyWebsite: stay.website || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, requestId: ref.id, status: "pending_property_confirmation" });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("stay booking request error", error);
    return NextResponse.json({ error: "Unable to submit this stay request." }, { status: 500 });
  }
}
