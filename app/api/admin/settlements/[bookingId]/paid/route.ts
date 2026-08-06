import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { recordOperatorSettlementPaid } from "@/lib/settlement-payment-recorder";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession(["admin"]);
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
          paidAmountCents?: unknown;
          externalPaymentReference?: unknown;
          externalPaymentMethod?: unknown;
          paymentNote?: unknown;
        }
      | null;

    if (body?.attested !== true) {
      return NextResponse.json(
        {
          error:
            "You must attest that the external operator payout was completed before recording it as paid.",
        },
        { status: 400 },
      );
    }

    const result = await recordOperatorSettlementPaid({
      bookingId,
      actorId: session.uid,
      paidAmountCents: body.paidAmountCents,
      externalPaymentReference: body.externalPaymentReference,
      externalPaymentMethod: body.externalPaymentMethod,
      paymentNote: body.paymentNote,
    });

    return NextResponse.json({
      ok: true,
      moneyMovedByViGuide: false,
      ...result,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("settlement payment evidence error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to record settlement payment evidence.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 409 },
    );
  }
}
