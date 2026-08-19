import { NextResponse } from "next/server";

import {
  OfficialTaxiRateUnavailableError,
  quoteOfficialTaxiFare,
} from "@/lib/usvi-taxi-tariffs";
import {
  CYRIL_E_KING_AIRPORT,
  RED_HOOK,
} from "@/lib/mobility-hubs";
import type { EstateRecord } from "@/types/usvi";

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
      const parsed = JSON.parse(serviceAccountJson) as { project_id?: unknown; client_email?: unknown };
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

function diagnosticEndpoint(name: string): EstateRecord {
  return {
    ...CYRIL_E_KING_AIRPORT,
    id: `diagnostic:stt:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    geoid: `diagnostic:stt:${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    estateCode: `DIAGNOSTIC-${name}`,
    baseName: name,
    fullName: name,
    tariffEndpointName: name,
    aliases: [],
  };
}

const RELEASE_DESTINATIONS: EstateRecord[] = [
  diagnosticEndpoint("Charlotte Amalie"),
  diagnosticEndpoint("Crown Bay"),
  diagnosticEndpoint("Havensight"),
  RED_HOOK,
];

async function checkRoute(origin: EstateRecord, destination: EstateRecord) {
  try {
    const fare = await quoteOfficialTaxiFare({ origin, destination, passengers: 1, luggage: 0 });
    return {
      from: origin.tariffEndpointName ?? origin.baseName,
      to: destination.tariffEndpointName ?? destination.baseName,
      matched: true,
      ruleId: fare.rateRuleId,
      currency: fare.currency,
      total: fare.total,
      tariffId: fare.tariffId,
      tariffVersion: fare.tariffVersion,
    };
  } catch (error) {
    return {
      from: origin.tariffEndpointName ?? origin.baseName,
      to: destination.tariffEndpointName ?? destination.baseName,
      matched: false,
      error: error instanceof OfficialTaxiRateUnavailableError ? error.code : "tariff_diagnostic_failed",
      reason: error instanceof Error ? error.message : "Unknown tariff diagnostic failure.",
    };
  }
}

/** Temporary read-only Phase 1 release-gate diagnostic. No secrets or tariff table are returned. */
export async function GET() {
  const firebase = getFirebaseRuntimeIdentity();
  const routes = [];

  for (const destination of RELEASE_DESTINATIONS) {
    routes.push(await checkRoute(CYRIL_E_KING_AIRPORT, destination));
    routes.push(await checkRoute(destination, CYRIL_E_KING_AIRPORT));
  }

  const unknown = await checkRoute(CYRIL_E_KING_AIRPORT, diagnosticEndpoint("Definitely Unknown Destination"));
  const requiredRoutesPass = routes.length === 8 && routes.every((route) => route.matched);
  const unknownFailsClosed = !unknown.matched;

  return NextResponse.json({
    ok: requiredRoutesPass && unknownFailsClosed,
    island: "stt",
    firebase,
    releaseGate: {
      requiredRoutesPass,
      unknownFailsClosed,
      requiredRouteCount: routes.length,
    },
    routes,
    unknownRoute: unknown,
  });
}
