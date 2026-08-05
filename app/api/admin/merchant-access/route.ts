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
import {
  normalizePartnerApplicationId,
  partnerConversionConflict,
  partnerConversionPatch,
  resolveApprovedPartnerConversion,
  type ApprovedPartnerConversion,
} from "@/lib/partners/partner-conversion";

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
      | {
          email?: unknown;
          enabled?: unknown;
          listingIds?: unknown;
          partnerApplicationId?: unknown;
        }
      | null;
    const email = normalizeProvisioningEmail(body?.email);
    const enabled = body?.enabled === true;
    const partnerApplicationId = body?.partnerApplicationId
      ? normalizePartnerApplicationId(body.partnerApplicationId)
      : "";

    if (!isEmail(email) || typeof body?.enabled !== "boolean") {
      return NextResponse.json(
        { error: "A valid email and access choice are required." },
        { status: 400 },
      );
    }
    if (body?.partnerApplicationId && !partnerApplicationId) {
      return NextResponse.json(
        { error: "Choose a valid approved partner application." },
        { status: 400 },
      );
    }
    if (partnerApplicationId && !enabled) {
      return NextResponse.json(
        { error: "Partner conversion can only be recorded while granting access." },
        { status: 400 },
      );
    }

    const adminAuth = getAdminAuth();
    const db = getAdminDb();
    const user = await adminAuth.getUserByEmail(email);
    if (enabled && user.disabled) {
      return NextResponse.json(
        { error: "Enable this Firebase account before granting merchant access." },
        { status: 409 },
      );
    }

    const previousClaims = { ...(user.customClaims ?? {}) };
    const update = merchantClaimsForUpdate({
      currentClaims: previousClaims,
      enabled,
      listingIds: body?.listingIds,
    });

    if (!update.ok) {
      return NextResponse.json({ error: update.error }, { status: 409 });
    }

    const partnerRef = partnerApplicationId
      ? db.collection("partnerApplications").doc(partnerApplicationId)
      : null;
    let partnerConversion: ApprovedPartnerConversion | null = null;

    if (partnerRef) {
      const applicationSnapshot = await partnerRef.get();
      if (!applicationSnapshot.exists) {
        throw new PartnerConversionActionError(
          "The approved partner application was not found.",
          404,
        );
      }
      const resolution = resolveApprovedPartnerConversion({
        applicationId: partnerApplicationId,
        accountEmail: user.email ?? email,
        record: applicationSnapshot.data() ?? {},
      });
      if (!resolution.ok) {
        throw new PartnerConversionActionError(resolution.error, 409);
      }
      const conflict = partnerConversionConflict({
        conversion: resolution.conversion,
        targetUid: user.uid,
      });
      if (conflict) throw new PartnerConversionActionError(conflict, 409);
      if (!update.listingIds.includes(resolution.conversion.listingId)) {
        throw new PartnerConversionActionError(
          "The merchant scope must include the approved listing before onboarding can complete.",
          409,
        );
      }
      partnerConversion = resolution.conversion;
    }

    await adminAuth.revokeRefreshTokens(user.uid);
    await adminAuth.setCustomUserClaims(user.uid, update.claims);

    try {
      const now = new Date();
      await db.runTransaction(async (transaction) => {
        let freshConversion = partnerConversion;
        if (partnerRef && partnerApplicationId) {
          const freshSnapshot = await transaction.get(partnerRef);
          if (!freshSnapshot.exists) {
            throw new PartnerConversionActionError(
              "The approved partner application was not found.",
              404,
            );
          }
          const resolution = resolveApprovedPartnerConversion({
            applicationId: partnerApplicationId,
            accountEmail: user.email ?? email,
            record: freshSnapshot.data() ?? {},
          });
          if (!resolution.ok) {
            throw new PartnerConversionActionError(resolution.error, 409);
          }
          const conflict = partnerConversionConflict({
            conversion: resolution.conversion,
            targetUid: user.uid,
          });
          if (conflict) throw new PartnerConversionActionError(conflict, 409);
          if (!update.listingIds.includes(resolution.conversion.listingId)) {
            throw new PartnerConversionActionError(
              "The merchant scope no longer includes the approved listing.",
              409,
            );
          }
          freshConversion = resolution.conversion;
        }

        transaction.set(db.collection("merchantAccessAudit").doc(), {
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
          partnerApplicationId: freshConversion?.applicationId ?? null,
          createdAt: FieldValue.serverTimestamp(),
        });

        if (partnerRef && freshConversion && !freshConversion.convertedAt) {
          const conversionPatch = partnerConversionPatch({
            targetUid: user.uid,
            targetEmail: user.email ?? email,
            listingId: freshConversion.listingId,
            actorUid: session.uid,
            actorEmail: session.email,
            now,
          });
          if (!conversionPatch) {
            throw new PartnerConversionActionError(
              "The partner conversion record could not be prepared.",
              500,
            );
          }

          transaction.update(partnerRef, {
            ...conversionPatch,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          });
          transaction.set(db.collection("partnerApplicationAudit").doc(), {
            action: "merchant_access_granted",
            applicationId: freshConversion.applicationId,
            listingId: freshConversion.listingId,
            targetUid: user.uid,
            targetEmail: user.email ?? email,
            actorUid: session.uid,
            actorEmail: session.email ?? null,
            createdAt: now.toISOString(),
            serverCreatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
    } catch (auditError) {
      try {
        await adminAuth.setCustomUserClaims(user.uid, previousClaims);
        await adminAuth.revokeRefreshTokens(user.uid);
      } catch (rollbackError) {
        console.error("merchant access claims rollback failed", rollbackError);
      }
      console.error("merchant access audit rollback", auditError);
      if (auditError instanceof PartnerConversionActionError) {
        return NextResponse.json(
          { error: auditError.message },
          { status: auditError.status },
        );
      }
      return NextResponse.json(
        {
          error:
            "The audit and conversion records could not be saved, so the access change was rolled back.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      partnerConversionRecorded: Boolean(partnerConversion),
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
          ? partnerConversion
            ? "Merchant access and partner conversion were saved. The user must sign in again."
            : "Merchant access saved. The user must sign in again."
          : "Merchant access revoked. Existing sessions were invalidated.",
    });
  } catch (error) {
    if (error instanceof PartnerConversionActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
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

class PartnerConversionActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
