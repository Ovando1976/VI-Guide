import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  auditTaxiTariffRoutes,
  type TariffAuditDocument,
  type TariffRouteReview,
  type TariffRouteReviewDecision,
} from "@/lib/taxi-tariff-route-audit";

const AUDITED_ISLANDS = new Set(["stt", "stj", "stx"]);
const REVIEW_DECISIONS = new Set<TariffRouteReviewDecision>([
  "verified",
  "needs_changes",
  "rejected",
]);

function asIsoString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asReviewDecision(value: unknown): TariffRouteReviewDecision | undefined {
  return typeof value === "string" &&
    REVIEW_DECISIONS.has(value as TariffRouteReviewDecision)
    ? (value as TariffRouteReviewDecision)
    : undefined;
}

export async function GET() {
  try {
    await requireSession(["admin"]);

    const db = getAdminDb();
    const [tariffSnapshot, reviewSnapshot] = await Promise.all([
      db.collection("taxiTariffs").get(),
      db.collection("taxiTariffRouteReviews").get(),
    ]);

    const tariffs = tariffSnapshot.docs.flatMap<TariffAuditDocument>((document) => {
      const data = document.data() as Record<string, unknown>;
      const island = typeof data.island === "string" ? data.island : "";
      if (!AUDITED_ISLANDS.has(island)) return [];

      return [
        {
          id: document.id,
          island,
          title: asString(data.title),
          version: asString(data.version),
          sourceUrl: asString(data.sourceUrl),
          effectiveAt: asIsoString(data.effectiveAt),
          status: asString(data.status),
          activationStatus: asString(data.activationStatus),
          issuingAuthority: asString(data.issuingAuthority),
          currency: asString(data.currency),
          reviewReference: asString(data.reviewReference),
          reviewedBy: asString(data.reviewedBy),
          rules: Array.isArray(data.rules)
            ? (data.rules as TariffAuditDocument["rules"])
            : [],
        } satisfies TariffAuditDocument,
      ];
    });

    const routeReviews = reviewSnapshot.docs.flatMap<TariffRouteReview>((document) => {
      const data = document.data() as Record<string, unknown>;
      const tariffId = asString(data.tariffId);
      const ruleId = asString(data.ruleId);
      const decision = asReviewDecision(data.decision);
      if (!tariffId || !ruleId || !decision) return [];
      return [{ tariffId, ruleId, decision }];
    });

    const report = auditTaxiTariffRoutes(tariffs, routeReviews);
    const blocking = report.findings.filter(
      (finding) =>
        finding.status === "manual_confirmation_required" ||
        finding.status === "rejected",
    );

    return NextResponse.json(
      {
        ok: report.blockingFindings === 0,
        generatedAt: report.generatedAt,
        tariffCount: report.tariffCount,
        ruleCount: report.ruleCount,
        blockingFindings: report.blockingFindings,
        byIsland: report.byIsland,
        blocking,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("taxi tariff route audit error", error);
    return NextResponse.json(
      { error: "Unable to audit production taxi tariff routes." },
      { status: 500 },
    );
  }
}
