import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking status is not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { reference?: unknown; email?: unknown }
    | null;
  const reference = clean(body?.reference, 80).toUpperCase();
  const email = clean(body?.email, 220).toLowerCase();

  if (!reference || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter the booking reference and email used for the request." },
      { status: 400 },
    );
  }

  const snapshot = await getAdminDb()
    .collection("commerceBookings")
    .where("reference", "==", reference)
    .limit(1)
    .get();

  if (snapshot.empty) return notFound();

  const document = snapshot.docs[0];
  const data = document.data();
  if (String(data.email ?? "").trim().toLowerCase() !== email) return notFound();

  return NextResponse.json({
    booking: {
      id: document.id,
      reference: String(data.reference ?? reference),
      status: String(data.status ?? "requested"),
      paymentStatus: data.paymentStatus ? String(data.paymentStatus) : null,
      kind: String(data.kind ?? "experience"),
      listingName: String(data.listingName ?? "VI Guide booking"),
      island: String(data.island ?? "stt"),
      startDate: String(data.startDate ?? ""),
      endDate: data.endDate ? String(data.endDate) : null,
      preferredTime: data.preferredTime ? String(data.preferredTime) : null,
      proposedTime: data.proposedTime ? String(data.proposedTime) : null,
      merchantNote: data.merchantNote ? String(data.merchantNote) : null,
      adults: Number(data.adults ?? 1),
      children: Number(data.children ?? 0),
      depositAmountCents: Number(data.depositAmountCents ?? 0),
      paidAmountCents: Number(data.paidAmountCents ?? 0),
      paymentHref: data.paymentHref ? String(data.paymentHref) : null,
      updatedAt: String(data.updatedAt ?? data.createdAt ?? ""),
    },
  });
}

function notFound() {
  return NextResponse.json(
    { error: "No booking request matched that reference and email." },
    { status: 404 },
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
