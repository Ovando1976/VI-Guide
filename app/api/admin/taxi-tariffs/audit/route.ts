import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  auditTaxiTariffRoutes,
  type TariffAuditDocument,
} from "@/lib/taxi-tariff-route-audit";

const AUDITED_ISLANDS = new Set(["stt", "stj", "stx"]);

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

export async function GET() {
  try {
    await requireSession(["admin"]);

    const snapshot = await getAdminDb().collection("taxiTariffs").get();
    const tariffs: TariffAuditDocument[] = snapshot.docs
      .map((document) => {
        const data = document.data() as Record<string, unknown>;
        const island = typeof data.island === "string" ? data.island : "";
        if (!AUDITED_ISLANDS.has(island)) return null;

        return {
          id: document.id,
          island,
          title: typeof data.title === "string" ? data.title : undefined,
          version: typeof data.version === "string" ? data.version : undefined,
          sourceUrl:
            typeof data.sourceUrl === "string" ? data.sourceUrl : undefined,
          effectiveAt: asIsoString(data.effectiveAt),
          status: typeof data.status === "string" ? data.status : undefined,
          activationStatus:
            typeof data.activationStatus === "string"
              ? data.activationStatus
              : undefined,
          rules: Array.isArray(data.rules)
            ? (data.rules as TariffAuditDocument["rules"])
            : [],
        } satisfies TariffAuditDocument;
      })
      .filter((tariff): tariff is TariffAuditDocument => tariff !== null);

    const report = auditTaxiTariffRoutes(tariffs);
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
