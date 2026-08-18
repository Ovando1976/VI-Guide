import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  auditTaxiTariffRoutes,
  type TariffAuditDocument,
  type TariffAuditRule,
} from "@/lib/taxi-tariff-route-audit";

const AUDITED_ISLANDS = new Set(["stt", "stj", "stx"]);
const SCHEMA_VERSION = "1";
const REVIEW_DECISIONS = new Set(["verified", "needs_changes", "rejected"]);

const CSV_COLUMNS = [
  "schemaVersion",
  "tariffId",
  "island",
  "tariffVersion",
  "ruleId",
  "currentStatus",
  "currentReason",
  "conflictsWith",
  "originNames",
  "destinationNames",
  "originEstateGeoids",
  "destinationEstateGeoids",
  "originCandidateAliases",
  "destinationCandidateAliases",
  "onePassengerFare",
  "perPersonFare",
  "additionalPassengerFare",
  "fareConfirmationRequired",
  "fareConfirmationReason",
  "sourceUrl",
  "effectiveAt",
  "issuingAuthority",
  "currency",
  "reviewReference",
  "reviewDecision",
  "reviewNote",
  "reviewedOriginEstateGeoids",
  "reviewedDestinationEstateGeoids",
] as const;

type BridgeRow = Record<(typeof CSV_COLUMNS)[number], string>;

type ReviewImportRow = {
  tariffId: string;
  ruleId: string;
  reviewDecision: string;
  reviewNote?: string;
  reviewedOriginEstateGeoids?: string;
  reviewedDestinationEstateGeoids?: string;
};

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);
    const tariffs = await loadTariffs();
    const rows = buildRows(tariffs);
    const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";

    if (format === "json") {
      return NextResponse.json(
        {
          schemaVersion: SCHEMA_VERSION,
          generatedAt: new Date().toISOString(),
          rowCount: rows.length,
          rows,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const filename = `usvi-taxi-tariff-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(toCsv(rows), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("taxi tariff audit export error", error);
    return NextResponse.json({ error: "Unable to export tariff audit." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    const importedRows = await parseImport(request);
    const reviewRows = importedRows.filter((row) => row.reviewDecision.trim());

    if (!reviewRows.length) {
      return NextResponse.json(
        { error: "No reviewed rows were found. Set reviewDecision before importing." },
        { status: 400 },
      );
    }

    const tariffs = await loadTariffs();
    const current = new Map<string, { tariff: TariffAuditDocument; rule: TariffAuditRule }>();
    for (const tariff of tariffs) {
      for (const rule of tariff.rules) {
        current.set(`${tariff.id ?? ""}\u0000${rule.id}`, { tariff, rule });
      }
    }

    const accepted: Array<ReviewImportRow & { island: string; currentStatus: string; currentReason?: string }> = [];
    const report = auditTaxiTariffRoutes(tariffs);
    const findingMap = new Map(
      report.findings.map((finding) => [
        `${finding.tariffId ?? ""}\u0000${finding.ruleId}`,
        finding,
      ]),
    );

    for (const row of reviewRows) {
      const decision = row.reviewDecision.trim().toLowerCase();
      if (!REVIEW_DECISIONS.has(decision)) {
        return NextResponse.json(
          { error: `Invalid reviewDecision for ${row.ruleId}: ${row.reviewDecision}` },
          { status: 400 },
        );
      }
      if ((decision === "needs_changes" || decision === "rejected") && !row.reviewNote?.trim()) {
        return NextResponse.json(
          { error: `reviewNote is required for ${decision} on ${row.ruleId}.` },
          { status: 400 },
        );
      }

      const key = `${row.tariffId}\u0000${row.ruleId}`;
      const live = current.get(key);
      if (!live) {
        return NextResponse.json(
          { error: `Tariff rule no longer exists: ${row.tariffId}/${row.ruleId}. Re-export before importing.` },
          { status: 409 },
        );
      }
      const finding = findingMap.get(key);
      accepted.push({
        ...row,
        reviewDecision: decision,
        island: live.tariff.island,
        currentStatus: finding?.status ?? "unknown",
        currentReason: finding?.reason,
      });
    }

    const db = getAdminDb();
    for (let start = 0; start < accepted.length; start += 400) {
      const batch = db.batch();
      for (const row of accepted.slice(start, start + 400)) {
        const reviewId = createHash("sha256")
          .update(`${row.tariffId}\u0000${row.ruleId}`)
          .digest("hex");
        batch.set(
          db.collection("taxiTariffRouteReviews").doc(reviewId),
          {
            schemaVersion: SCHEMA_VERSION,
            tariffId: row.tariffId,
            ruleId: row.ruleId,
            island: row.island,
            decision: row.reviewDecision,
            note: row.reviewNote?.trim() || null,
            reviewedOriginEstateGeoids: splitList(row.reviewedOriginEstateGeoids),
            reviewedDestinationEstateGeoids: splitList(row.reviewedDestinationEstateGeoids),
            currentAuditStatus: row.currentStatus,
            currentAuditReason: row.currentReason ?? null,
            reviewedBy: session.uid,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      await batch.commit();
    }

    await db.collection("taxiTariffAudit").add({
      action: "tariff_route_review_batch_imported",
      actorId: session.uid,
      schemaVersion: SCHEMA_VERSION,
      reviewedRowCount: accepted.length,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      imported: accepted.length,
      note: "Review decisions were recorded only. No tariff fares, route rules, activation state, or quote behavior were modified.",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("taxi tariff audit import error", error);
    return NextResponse.json({ error: "Unable to import tariff audit reviews." }, { status: 500 });
  }
}

async function loadTariffs(): Promise<TariffAuditDocument[]> {
  const snapshot = await getAdminDb().collection("taxiTariffs").get();
  return snapshot.docs.flatMap<TariffAuditDocument>((document) => {
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
        rules: Array.isArray(data.rules) ? (data.rules as TariffAuditDocument["rules"]) : [],
      },
    ];
  });
}

function buildRows(tariffs: TariffAuditDocument[]): BridgeRow[] {
  const report = auditTaxiTariffRoutes(tariffs);
  const findings = new Map(
    report.findings.map((finding) => [
      `${finding.tariffId ?? ""}\u0000${finding.ruleId}`,
      finding,
    ]),
  );

  return tariffs.flatMap((tariff) =>
    tariff.rules.map((rule) => {
      const finding = findings.get(`${tariff.id ?? ""}\u0000${rule.id}`);
      return {
        schemaVersion: SCHEMA_VERSION,
        tariffId: tariff.id ?? "",
        island: tariff.island,
        tariffVersion: tariff.version ?? "",
        ruleId: rule.id,
        currentStatus: finding?.status ?? "",
        currentReason: finding?.reason ?? "",
        conflictsWith: finding?.conflictsWith ?? "",
        originNames: joinList(rule.originNames),
        destinationNames: joinList(rule.destinationNames),
        originEstateGeoids: joinList(rule.originEstateGeoids),
        destinationEstateGeoids: joinList(rule.destinationEstateGeoids),
        originCandidateAliases: joinList(rule.originCandidateAliases),
        destinationCandidateAliases: joinList(rule.destinationCandidateAliases),
        onePassengerFare: numberString(rule.onePassengerFare),
        perPersonFare: numberString(rule.perPersonFare),
        additionalPassengerFare: numberString(rule.additionalPassengerFare),
        fareConfirmationRequired: rule.fareConfirmationRequired ?? "",
        fareConfirmationReason: rule.fareConfirmationReason ?? "",
        sourceUrl: tariff.sourceUrl ?? "",
        effectiveAt: tariff.effectiveAt ?? "",
        issuingAuthority: tariff.issuingAuthority ?? "",
        currency: tariff.currency ?? "",
        reviewReference: tariff.reviewReference ?? "",
        reviewDecision: "",
        reviewNote: "",
        reviewedOriginEstateGeoids: "",
        reviewedDestinationEstateGeoids: "",
      };
    }),
  );
}

async function parseImport(request: NextRequest): Promise<ReviewImportRow[]> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("text/csv")) {
    return parseCsv(await request.text()).map(toReviewRow);
  }

  const body = (await request.json()) as { schemaVersion?: unknown; rows?: unknown };
  if (body.schemaVersion !== SCHEMA_VERSION || !Array.isArray(body.rows)) {
    throw new Error("Unsupported tariff audit review manifest.");
  }
  return body.rows.map((row) => toReviewRow(row as Record<string, unknown>));
}

function toReviewRow(row: Record<string, unknown>): ReviewImportRow {
  return {
    tariffId: value(row.tariffId),
    ruleId: value(row.ruleId),
    reviewDecision: value(row.reviewDecision),
    reviewNote: value(row.reviewNote),
    reviewedOriginEstateGeoids: value(row.reviewedOriginEstateGeoids),
    reviewedDestinationEstateGeoids: value(row.reviewedDestinationEstateGeoids),
  };
}

function toCsv(rows: BridgeRow[]) {
  return [CSV_COLUMNS.join(","), ...rows.map((row) => CSV_COLUMNS.map((column) => csvCell(row[column])).join(","))].join("\r\n");
}

function parseCsv(input: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...data] = rows.filter((candidate) => candidate.some((cell) => cell.trim()));
  if (!headers) return [];
  return data.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index] ?? ""])),
  );
}

function csvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function splitList(input: string | undefined) {
  return (input ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(input: string[] | undefined) {
  return (input ?? []).join(" | ");
}

function numberString(input: number | undefined) {
  return typeof input === "number" ? String(input) : "";
}

function value(input: unknown) {
  return typeof input === "string" ? input : "";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

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
