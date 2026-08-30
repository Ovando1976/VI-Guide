import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson } from "@/lib/social/http";
import { searchSocialProfiles } from "@/lib/social/profile-service";
import { boundedSocialLimit } from "@/lib/social/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const limit = boundedSocialLimit(request.nextUrl.searchParams.get("limit"), 24, 50);
    const profiles = await searchSocialProfiles(query, limit);
    return socialJson({ profiles });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
