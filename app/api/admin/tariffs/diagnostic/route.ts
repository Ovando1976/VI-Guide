import { NextResponse } from "next/server";

import {
  OfficialTaxiRateUnavailableError,
  quoteOfficialTaxiFare,
} from "@/lib/usvi-taxi-tariffs";
import {
  CYRIL_E_KING_AIRPORT,
  RED_HOOK,
} from "@/lib/mobility-hubs";

export const dynamic = "force-dynamic";

/**
 * Temporary, read-only Phase 1 diagnostic.
 *
 * Uses the exact production quote path with the exported canonical mobility
 * endpoints. It returns no credentials and no tariff table. This revision
 * intentionally refreshes the preview after Firebase Admin config was enabled.
 */
export async function GET() {
  const origin = CYRIL_E_KING_AIRPORT;
  const destination = RED_HOOK;

  try {
    const fare = await quoteOfficialTaxiFare({
      origin,
      destination,
      passengers: 1,
      luggage: 0,
    });

    return NextResponse.json({
      ok: true,
      island: "stt",
      smokeRoute: {
        from: origin.baseName,
        tariffFrom: origin.tariffEndpointName ?? origin.baseName,
        to: destination.baseName,
        tariffTo: destination.tariffEndpointName ?? destination.baseName,
        matched: true,
      },
      tariff: {
        id: fare.tariffId,
        title: fare.tariffTitle,
        version: fare.tariffVersion,
        effectiveAt: fare.tariffEffectiveAt,
        ruleId: fare.rateRuleId,
      },
      fare: {
        currency: fare.currency,
        total: fare.total,
        routeFare: fare.routeFare,
        passengerFare: fare.passengerFare,
        luggageFare: fare.luggageFare,
      },
    });
  } catch (error) {
    const expected = error instanceof OfficialTaxiRateUnavailableError;
    return NextResponse.json(
      {
        ok: false,
        island: "stt",
        smokeRoute: {
          from: origin.baseName,
          tariffFrom: origin.tariffEndpointName ?? origin.baseName,
          to: destination.baseName,
          tariffTo: destination.tariffEndpointName ?? destination.baseName,
          matched: false,
        },
        error: expected ? error.code : "tariff_diagnostic_failed",
        reason: error instanceof Error ? error.message : "Unknown tariff diagnostic failure.",
      },
      { status: expected ? error.status : 500 },
    );
  }
}
