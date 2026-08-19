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

type FirebaseRuntimeIdentity = {
  projectId: string | null;
  clientEmail: string | null;
  source: "service_account_json" | "individual_env" | "unavailable";
};

function getFirebaseRuntimeIdentity(): FirebaseRuntimeIdentity {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson) as {
        project_id?: unknown;
        client_email?: unknown;
      };

      return {
        projectId: typeof parsed.project_id === "string" ? parsed.project_id : null,
        clientEmail: typeof parsed.client_email === "string" ? parsed.client_email : null,
        source: "service_account_json",
      };
    } catch {
      return {
        projectId: process.env.FIREBASE_PROJECT_ID ?? null,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? null,
        source: "individual_env",
      };
    }
  }

  if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID ?? null,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? null,
      source: "individual_env",
    };
  }

  return { projectId: null, clientEmail: null, source: "unavailable" };
}

/**
 * Temporary, read-only Phase 1 diagnostic.
 *
 * Uses the exact production quote path with the exported canonical mobility
 * endpoints. It returns no credentials, private keys, tokens, or tariff table.
 * The Firebase identity block contains only project ID and service-account email
 * so IAM configuration can be verified safely.
 */
export async function GET() {
  const origin = CYRIL_E_KING_AIRPORT;
  const destination = RED_HOOK;
  const firebase = getFirebaseRuntimeIdentity();

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
      firebase,
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
        firebase,
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
