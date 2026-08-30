import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import { enforceSocialRateLimit } from "@/lib/social/rate-limit";
import { createSocialReport } from "@/lib/social/report-service";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await enforceSocialRateLimit(identity.uid, "report", { max: 20, windowSeconds: 3600 });
    const body = await readJsonObject(request);
    const report = await createSocialReport(identity.uid, {
      targetType: body.targetType,
      targetId: body.targetId,
      reason: body.reason,
      details: body.details,
    });
    return socialJson({ report }, { status: 201 });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
