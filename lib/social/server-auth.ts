import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest } from "next/server";

import { getAdminAuth, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { bearerTokenFromAuthorization } from "@/lib/intelligence/identity";

export class SocialAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialAuthenticationError";
  }
}

export type VerifiedSocialIdentity = Readonly<{
  uid: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  claims: DecodedIdToken;
}>;

export async function verifiedSocialIdentity(
  request: NextRequest,
): Promise<VerifiedSocialIdentity> {
  const token = bearerTokenFromAuthorization(request.headers.get("authorization"));
  if (!token) throw new SocialAuthenticationError("Authentication is required.");
  if (!hasFirebaseAdminConfiguration()) {
    throw new SocialAuthenticationError("Social authentication is not configured.");
  }

  try {
    const claims = await getAdminAuth().verifyIdToken(token);
    return Object.freeze({
      uid: claims.uid,
      email: typeof claims.email === "string" ? claims.email : null,
      displayName: typeof claims.name === "string" ? claims.name : null,
      avatarUrl: typeof claims.picture === "string" ? claims.picture : null,
      claims,
    });
  } catch {
    throw new SocialAuthenticationError("Invalid user session.");
  }
}
