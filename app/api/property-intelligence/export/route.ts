import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { loadPropertyIntelligence } from "@/lib/property-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json({ error: "Property Intelligence is not configured." }, { status: 503 });
    }

    const entitlement = (
      await getAdminDb().collection("propertyIntelligenceEntitlements").doc(session.uid).get()
    ).data();

    if (!entitlement || entitlement.active !== true || entitlement.status !== "paid") {
      return NextResponse.json(
        { error: "A paid Property Intelligence entitlement is required." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const format = request.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "csv";
    const records = await loadPropertyIntelligence();
    const generatedAt = new Date().toISOString();

    if (format === "json") {
      return new NextResponse(
        JSON.stringify(
          {
            meta: {
              product: "USVI Explorer Property Intelligence Export Pack",
              generatedAt,
              schemaVersion: 1,
              overlayPolicy: "fail-closed",
              recordCount: records.length,
            },
            records,
          },
          null,
          2,
        ),
        {
          status: 200,
          headers: downloadHeaders("application/json; charset=utf-8", "usvi-property-intelligence.json"),
        },
      );
    }

    if (format !== "csv") {
      return NextResponse.json({ error: "Invalid format. Use csv or json." }, { status: 400 });
    }

    const rows = [
      [
        "record_id",
        "geoid",
        "estate_name",
        "full_name",
        "island",
        "estate_code",
        "aliases",
        "centroid_lat",
        "centroid_lng",
        "geometry_type",
        "parcel_status",
        "parcel_ids",
        "zoning_status",
        "zoning_codes",
        "historic_district_status",
        "historic_district_names",
        "sources",
        "generated_from",
        "overlay_policy",
      ],
      ...records.map((record) => [
        record.id,
        record.estate.geoid,
        record.estate.name,
        record.estate.fullName,
        record.estate.island,
        record.estate.estateCode ?? "",
        record.estate.aliases.join(" | "),
        record.estate.centroid?.lat ?? "",
        record.estate.centroid?.lng ?? "",
        record.estate.geometryType ?? "",
        record.overlays.parcel.status,
        record.overlays.parcel.parcelIds.join(" | "),
        record.overlays.zoning.status,
        record.overlays.zoning.codes.join(" | "),
        record.overlays.historicDistrict.status,
        record.overlays.historicDistrict.names.join(" | "),
        record.provenance.sources.join(" | "),
        record.provenance.generatedFrom,
        record.provenance.overlayPolicy,
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: downloadHeaders("text/csv; charset=utf-8", "usvi-property-intelligence.csv"),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("property intelligence export error", error);
    return NextResponse.json({ error: "Unable to generate Property Intelligence export." }, { status: 500 });
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadHeaders(contentType: string, filename: string) {
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  };
}
