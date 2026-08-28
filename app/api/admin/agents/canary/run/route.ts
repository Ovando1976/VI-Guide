import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  evaluateManualAgentCanary,
  runManualAgentCanary,
} from "@/lib/intelligence/agent-manual-canary";
import {
  claimManualAgentCanaryRun,
  recordManualAgentCanaryEvent,
  validManualAgentCanaryIdempotencyKey,
} from "@/lib/intelligence/agent-manual-canary-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireSession(["admin"]);

    const gate = evaluateManualAgentCanary();
    if (!gate.selected || gate.environment !== "preview") {
      return NextResponse.json(
        {
          error: "Synthetic agent canary is unavailable in this environment.",
          reason: gate.reason,
          environment: gate.environment,
        },
        {
          status: gate.reason === "environment_denied" ? 403 : 503,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? null;
    if (!validManualAgentCanaryIdempotencyKey(idempotencyKey)) {
      return NextResponse.json(
        { error: "A valid Idempotency-Key header is required." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const claim = await claimManualAgentCanaryRun(idempotencyKey as string);
    if (claim.status === "unavailable" || !claim.runId || !claim.claimId) {
      return NextResponse.json(
        { error: "Synthetic canary control storage is unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (claim.status === "replayed") {
      return NextResponse.json(
        {
          status: "replayed",
          runId: claim.runId,
          environment: gate.environment,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (claim.status === "pending") {
      return NextResponse.json(
        {
          error: "This canary request was already claimed and will not be re-executed.",
          status: "pending",
          runId: claim.runId,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await runManualAgentCanary(claim.runId, gate);
    await recordManualAgentCanaryEvent({
      runId: claim.runId,
      claimId: claim.claimId,
      control: result.control,
      workerStatus: result.worker.status,
    });

    return NextResponse.json(
      {
        status: "completed",
        runId: result.runId,
        environment: result.environment,
        worker: result.worker,
        boundaries: {
          syntheticContextOnly: true,
          readOnlyBrokerOnly: true,
          allowedCapabilities: ["recommend", "knowledge"],
          maxWorkerTasks: 1,
          productionDenied: true,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Manual agent canary failed safely.", error);
    return NextResponse.json(
      { error: "Synthetic agent canary could not complete safely." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
