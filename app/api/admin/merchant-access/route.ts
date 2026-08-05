import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminAuth,
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizeManagedListingIds } from "@/lib/merchant-access";
import {
  merchantClaimsForUpdate,
  normalizeProvisioningEmail,
  provisionableMerchantRole,
} from "@/lib/merchant-provisioning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant access is not configured on the server." },
        { status: 503 },
      );
    }

    const email = normalizeProvisioningEmail(
      request.nextUrl.searchParams.get("email"),
    );
    if (!isEmail(email)) {
      return NextResponse.json(
        { error: "Enter a valid account email." },
        { status: 400 },
      );
    }

    const user = await getAdminAuth().getUserByEmail(email);
    const role = claimRole(user.customClaims?.role);

    return NextResponse.json({
      account: {
        uid: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? null,
        disabled: user.disabled,
        role,
        listingIds: normalizeManagedListingIds(user.customClaims?.listingIds),
        editable: Boolean(provisionableMerchantRole(role)),
        lastSignInAt: user.metadata.lastSignInTime ?? null,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (isFirebaseUserNotFound(error)) {
      return NextResponse.json(
        { error: "No Firebase account exists for that email." },
        { status: 404 },
      );
    }
    console.error("merchant access lookup error", error);
    return NextResponse.json(
      { error: "Unable to load merchant access." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant access is not configured on the server." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: unknown; enabled?: unknown; listingIds?: unknown }
      | null;
    const email = normalizeProvisioningEmail(body?.email);
    const enabled = body?.enabled === true;

    if (!isEmail(email) || typeof body?.enabled !== "boolean") {
      return NextResponse.json(
        { error: "A valid email and access choice are required." },
        { status: 400 },
      );
    }

    const adminAuth = getAdminAuth();
    const user = await adminAuth.getUserByEmail(email);
    const previousClaims = { ...(user.customClaims ?? {}) };
    const update = merchantClaimsForUpdate({
      currentClaims: previousClaims,
      enabled,
      listingIds: body?.listingIds,
    });

    if (!update.ok) {
      return NextResponse.json({ error: update.error }, { status: 409 });
    }

    await adminAuth.revokeRefreshTokens(user.uid);
    await adminAuth.setCustomUserClaims(user.uid, update.claims);

    try {
      await getAdminDb().collection("merchantAccessAudit").add({
        action:
          update.nextRole === "merchant"
            ? update.currentRole === "merchant"
              ? "merchant_scope_updated"
              : "merchant_access_granted"
            : "merchant_access_revoked",
        actorUid: session.uid,
        actorEmail: session.email ?? null,
        targetUid: user.uid,
        targetEmail: user.email ?? email,
        previousRole: update.currentRole,
        previousListingIds: update.previousListingIds,
        nextRole: update.nextRole,
        listingIds: update.listingIds,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      await adminAuth.setCustomUserClaims(user.uid, previousClaims);
      console.error("merchant access audit rollback", auditError);
      return NextResponse.json(
        {
          error:
            "The audit record could not be saved, so the access change was rolled back.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      account: {
        uid: user.uid,
        email: user.email ?? email,
        displayName: user.displayName ?? null,
        disabled: user.disabled,
        role: update.nextRole,
        listingIds: update.listingIds,
        editable: true,
        lastSignInAt: user.metadata.lastSignInTime ?? null,
      },
      message:
        update.nextRole === "merchant"
          ? "Merchant access saved. The user must sign in again."
          : "Merchant access revoked. Existing sessions were invalidated.",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (isFirebaseUserNotFound(error)) {
      return NextResponse.json(
        { error: "No Firebase account exists for that email." },
        { status: 404 },
      );
    }
    console.error("merchant access update error", error);
    return NextResponse.json(
      { error: "Unable to update merchant access." },
      { status: 500 },
    );
  }
}

function claimRole(value: unknown) {
  return value === "admin" ||
    value === "dispatcher" ||
    value === "driver" ||
    value === "merchant"
    ? value
    : "rider";
}

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function isFirebaseUserNotFound(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "auth/user-not-found",
  );
}
