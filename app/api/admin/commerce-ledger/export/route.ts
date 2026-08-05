import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  buildCommerceLedgerCsv,
  commerceLedgerCsvFilename,
} from "@/lib/payments/commerce-ledger-csv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Commerce accounting is not configured on the server." },
        { status: 503 },
      );
    }

    const listingId = clean(
      request.nextUrl.searchParams.get("listingId"),
      180,
    );
    const snapshot = await getAdminDb()
      .collection("commerceLedgerEntries")
      .orderBy("occurredAt", "desc")
      .get();
    const generatedAt = new Date();
    const csv = buildCommerceLedgerCsv(
      snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })),
      { listingId, generatedAt },
    );

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${commerceLedgerCsvFilename({
          listingId,
          generatedAt,
        })}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce ledger export error", error);
    return NextResponse.json(
      { error: "Unable to export commerce accounting." },
      { status: 500 },
    );
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
