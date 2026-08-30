import type { NextRequest } from "next/server";

import { socialErrorResponse, socialJson, readJsonObject } from "@/lib/social/http";
import {
  ensureSocialProfile,
  getSocialProfile,
  getSocialProfileByHandle,
  publicSocialProfile,
  updateSocialProfile,
} from "@/lib/social/profile-service";
import { verifiedSocialIdentity } from "@/lib/social/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const handle = request.nextUrl.searchParams.get("handle");
    const userId = request.nextUrl.searchParams.get("userId");
    if (handle || userId) {
      const profile = handle
        ? await getSocialProfileByHandle(handle)
        : await getSocialProfile(String(userId));
      if (!profile || profile.state === "deleted") return socialJson({ error: "Profile was not found." }, { status: 404 });
      return socialJson({ profile: publicSocialProfile(profile) });
    }

    const identity = await verifiedSocialIdentity(request);
    const profile = await ensureSocialProfile(identity);
    return socialJson({ profile: publicSocialProfile(profile) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await verifiedSocialIdentity(request);
    await ensureSocialProfile(identity);
    const body = await readJsonObject(request);
    const profile = await updateSocialProfile(identity.uid, body);
    return socialJson({ profile: publicSocialProfile(profile) });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
