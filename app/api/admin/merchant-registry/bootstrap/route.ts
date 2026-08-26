import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { buildMerchantRegistryCatalog } from "@/lib/partners/merchant-registry-catalog";
import {
  maxMerchantStage,
  merchantRegistryCanonicalKey,
  normalizeMerchantAcquisitionStage,
  type MerchantAcquisitionStage,
} from "@/lib/partners/merchant-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Merchant registry is not configured." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const candidates = buildMerchantRegistryCatalog();
    const refs = candidates.map((candidate) =>
      db.collection("merchantRegistry").doc(candidate.id),
    );
    const existingSnapshots = refs.length ? await db.getAll(...refs) : [];
    const existingById = new Map(
      existingSnapshots.map((snapshot) => [snapshot.id, snapshot]),
    );

    const claimsSnapshot = await db.collection("businessClaims").limit(1000).get();
    const claims = claimsSnapshot.docs.map((document) => document.data());
    const claimStagesByCanonicalKey = new Map<string, MerchantAcquisitionStage>();
    const claimStagesByListingId = new Map<string, MerchantAcquisitionStage>();

    for (const claim of claims) {
      const status = String(claim.status ?? "new");
      const claimStage: MerchantAcquisitionStage =
        status === "approved" ? "verified" : "claimed";
      const canonicalKey = merchantRegistryCanonicalKey(
        claim.island,
        claim.businessName,
      );
      const listingId = clean(claim.existingListingId, 180);
      if (canonicalKey) {
        claimStagesByCanonicalKey.set(
          canonicalKey,
          maxMerchantStage(claimStagesByCanonicalKey.get(canonicalKey), claimStage),
        );
      }
      if (listingId) {
        claimStagesByListingId.set(
          listingId,
          maxMerchantStage(claimStagesByListingId.get(listingId), claimStage),
        );
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    let created = 0;
    let refreshed = 0;
    let reconciledClaims = 0;

    for (let start = 0; start < candidates.length; start += 400) {
      const batch = db.batch();
      for (const candidate of candidates.slice(start, start + 400)) {
        const existingSnapshot = existingById.get(candidate.id);
        const existing = existingSnapshot?.data() ?? {};
        const listingClaimStage = candidate.sourceRecordIds.reduce<
          MerchantAcquisitionStage | undefined
        >((best, listingId) => {
          const stage = claimStagesByListingId.get(listingId);
          return stage ? maxMerchantStage(best, stage) : best;
        }, undefined);
        const canonicalClaimStage = claimStagesByCanonicalKey.get(candidate.canonicalKey);
        const claimStage = listingClaimStage
          ? maxMerchantStage(listingClaimStage, canonicalClaimStage)
          : canonicalClaimStage;
        const stage = maxMerchantStage(
          normalizeMerchantAcquisitionStage(existing.stage) ?? candidate.seedStage,
          claimStage,
        );
        if (
          claimStage &&
          stage !== (normalizeMerchantAcquisitionStage(existing.stage) ?? candidate.seedStage)
        ) {
          reconciledClaims += 1;
        }

        const payload: FirebaseFirestore.DocumentData = {
          canonicalKey: candidate.canonicalKey,
          businessName: candidate.businessName,
          island: candidate.island,
          category: candidate.category,
          stage,
          sourceKinds: candidate.sourceKinds,
          sourceRecordIds: candidate.sourceRecordIds,
          sourceUrls: candidate.sourceUrls,
          website: candidate.website,
          phone: candidate.phone,
          location: candidate.location,
          catalogUpdatedAt: nowIso,
          serverCatalogUpdatedAt: FieldValue.serverTimestamp(),
        };
        if (!existingSnapshot?.exists) {
          payload.status = "active";
          payload.createdAt = nowIso;
          payload.updatedAt = nowIso;
          payload.serverCreatedAt = FieldValue.serverTimestamp();
          created += 1;
        } else {
          refreshed += 1;
        }
        if (claimStage) {
          payload.claimStageReconciledAt = nowIso;
        }

        batch.set(
          db.collection("merchantRegistry").doc(candidate.id),
          payload,
          { merge: true },
        );
      }
      await batch.commit();
    }

    await db.collection("merchantRegistryAudit").add({
      action: "catalog_bootstrap",
      actorUid: session.uid,
      actorEmail: session.email ?? null,
      candidateCount: candidates.length,
      created,
      refreshed,
      reconciledClaims,
      createdAt: nowIso,
      serverCreatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      candidateCount: candidates.length,
      created,
      refreshed,
      reconciledClaims,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("merchant registry bootstrap error", error);
    return NextResponse.json(
      { error: "Unable to refresh the merchant registry from the audited catalogs." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
