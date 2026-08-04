import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Merchant bookings are not configured on the server." },
      { status: 503 },
    );
  }

  const listingId = clean(request.nextUrl.searchParams.get("listingId"), 160);
  let query = getAdminDb().collection("commerceBookings").orderBy("createdAt", "desc").limit(100);

  if (listingId) {
    query = getAdminDb()
      .collection("commerceBookings")
      .where("listingId", "==", listingId)
      .orderBy("createdAt", "desc")
      .limit(100);
  }

  const snapshot = await query.get();
  const bookings = snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      reference: String(data.reference ?? ""),
      status: String(data.status ?? "requested"),
      kind: String(data.kind ?? "experience"),
      listingId: String(data.listingId ?? ""),
      listingName: String(data.listingName ?? "VI Guide booking"),
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
      createdAt: String(data.createdAt ?? ""),
      updatedAt: String(data.updatedAt ?? data.createdAt ?? ""),
    };
  });

  return NextResponse.json({ bookings });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
