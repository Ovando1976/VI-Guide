import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  assertMobilityPilotActive,
  buildMobilityPilotGateReport,
  getMobilityPilotControl,
  MOBILITY_PILOT_ISLANDS,
} from "@/lib/mobility-pilot-readiness";

export async function GET() {
  try {
    await requireSession(["admin"]);
    const islands = await Promise.all(
      MOBILITY_PILOT_ISLANDS.map(async (island) => {
        const [control, report] = await Promise.all([
          getMobilityPilotControl(island),
          buildMobilityPilotGateReport(island),
        ]);

        let effectiveActive = false;
        let activationIssue: string | undefined;
        if (control.status === "active") {
          try {
            await assertMobilityPilotActive(island);
            effectiveActive = true;
          } catch (error) {
            activationIssue =
              error instanceof Error
                ? error.message
                : "The pilot activation could not be verified.";
          }
        }

        return {
          island,
          control,
          report,
          effectiveActive,
          activationIssue,
        };
      }),
    );

    return NextResponse.json({ ok: true, islands });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("mobility pilot readiness error", error);
    return NextResponse.json(
      { error: "Unable to load mobility pilot readiness." },
      { status: 500 },
    );
  }
}
