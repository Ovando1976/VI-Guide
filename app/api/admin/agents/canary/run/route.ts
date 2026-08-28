import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { runOperatorPreviewCanary } from "@/lib/intelligence/operator-preview-canary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession(["admin"]);
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { error: "Same-origin admin request required.", code: "AGENT_CANARY_ORIGIN_REQUIRED" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await runOperatorPreviewCanary();
    const status =
      result.status === "denied"
        ? 403
        : result.status === "already_running"
          ? 409
          : result.status === "failed"
            ? 500
            : 200;

    return NextResponse.json(result, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Unable to run the bounded preview canary.", code: "AGENT_CANARY_RUN_FAILED" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
