import { NextResponse } from "next/server";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  buildMobilityPilotGateReport,
  MOBILITY_PILOT_ISLANDS,
} from "@/lib/mobility-pilot-readiness";
import type { IslandCode } from "@/types/usvi";

type Check = { id: string; label: string; ready: boolean; detail: string };

export async function GET() {
  try {
    await requireSession(["admin"]);
    const checks: Check[] = [
      { id: "firebase-admin", label: "Firebase Admin", ready: hasFirebaseAdminConfiguration(), detail: hasFirebaseAdminConfiguration() ? "Server credentials detected." : "Firebase Admin credentials are missing." },
      { id: "stripe-secret", label: "Stripe live secret", ready: Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")), detail: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "Live Stripe key detected." : "A Stripe live secret key is not configured." },
      { id: "stripe-webhook", label: "Stripe webhook signing", ready: Boolean(process.env.STRIPE_WEBHOOK_SECRET), detail: process.env.STRIPE_WEBHOOK_SECRET ? "Webhook signing secret detected." : "Stripe webhook signing secret is missing." },
      { id: "app-url", label: "Production URL", ready: Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")), detail: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : "NEXT_PUBLIC_APP_URL must be an HTTPS production domain." },
      { id: "support", label: "Customer support", ready: Boolean(process.env.SUPPORT_EMAIL && process.env.SUPPORT_PHONE), detail: process.env.SUPPORT_EMAIL && process.env.SUPPORT_PHONE ? "Support email and phone detected." : "SUPPORT_EMAIL and SUPPORT_PHONE are required." },
    ];

    if (hasFirebaseAdminConfiguration()) {
      const reports = await Promise.all(
        MOBILITY_PILOT_ISLANDS.map(buildMobilityPilotGateReport),
      );
      const readyIslands = reports.filter((report) => report.ready);
      checks.push({
        id: "mobility-pilot-gates",
        label: "Mobility pilot gates",
        ready: readyIslands.length > 0,
        detail: reports
          .map(
            (report) =>
              `${islandLabel(report.island)}: ${report.ready ? "ready" : "blocked"}`,
          )
          .join("; "),
      });
    }

    return NextResponse.json({ ready: checks.every((check) => check.ready), checks, checkedAt: new Date().toISOString() });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to evaluate launch readiness." }, { status: 500 });
  }
}

function islandLabel(island: IslandCode) {
  return island === "stt"
    ? "St. Thomas"
    : island === "stj"
      ? "St. John"
      : "St. Croix";
}
