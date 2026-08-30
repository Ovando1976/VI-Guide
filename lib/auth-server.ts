import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminAuth } from "@/lib/firebase-admin";
import { normalizeManagedListingIds } from "@/lib/merchant-access";

export const SESSION_COOKIE = "vi_session";
export type AppRole =
  | "rider"
  | "driver"
  | "merchant"
  | "dispatcher"
  | "admin";

export type AppSession = {
  uid: string;
  email?: string;
  name?: string;
  role: AppRole;
  driverId?: string;
  listingIds?: string[];
};

export async function getSession(): Promise<AppSession | null> {
  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const token = await getAdminAuth().verifySessionCookie(value, true);
    const role = normalizeRole(token.role);
    const listingIds = normalizeManagedListingIds(token.listingIds);

    return {
      uid: token.uid,
      email: typeof token.email === "string" ? token.email : undefined,
      name: typeof token.name === "string" ? token.name : undefined,
      role,
      driverId:
        typeof token.driverId === "string" ? token.driverId : undefined,
      ...(role === "merchant" && listingIds.length ? { listingIds } : {}),
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: AppRole[]) {
  const session = await getSession();
  if (!session) throw new AuthError("Authentication required.", 401);
  if (roles && !roles.includes(session.role)) {
    throw new AuthError("You do not have permission to perform this action.", 403);
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403,
  ) {
    super(message);
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

function normalizeRole(value: unknown): AppRole {
  return value === "admin" ||
    value === "dispatcher" ||
    value === "driver" ||
    value === "merchant"
    ? value
    : "rider";
}
