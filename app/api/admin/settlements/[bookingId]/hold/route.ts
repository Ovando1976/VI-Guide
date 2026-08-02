import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { holdOperatorSettlement } from "@/lib/settlement-governance";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession(["admin", "dispatcher"]);
    const bookingId = params.bookingId.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          attested?: boolean;
          reason?: unknown;
          reviewReference?: unknown;
        }
      | null;
    if (body?.attested !== true) {
      return NextResponse.json(
        { error: "Settlement hold attestation is required." },
        { status: 400 },
      );
    }
    const reason = cleanText(body.reason, 400);
    const reviewReference = cleanText(body.reviewReference, 180);
    if (!reason || !reviewReference) {
      return NextResponse.json(
        { error: "Hold reason and review reference are required." },
        { status: 400 },
      );
    }

    const result = await holdOperatorSettlement({
      bookingId,
      actorId: session.uid,
      reason,
      reviewReference,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("settlement hold error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to hold operator settlement.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 409 },
    );
  }
}

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}
