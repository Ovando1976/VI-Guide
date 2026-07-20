import { NextRequest, NextResponse } from "next/server";

import { getConciergeDirectoryEvidence } from "@/lib/concierge-directory-evidence";
import { POST as legacyConciergePost } from "@/app/api/concierge/chat/route";
import type { ConciergeChatRequest, ConciergeReply } from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestForLegacyRoute = request.clone();
  const body = (await request.json().catch(() => null)) as ConciergeChatRequest | null;

  if (!body || typeof body.message !== "string" || !body.context) {
    return NextResponse.json({ error: "Invalid concierge request." }, { status: 400 });
  }

  const evidencePromise = Promise.resolve(
    getConciergeDirectoryEvidence({
      query: body.message,
      island: body.context.island,
      selectedEstateGeoid: body.context.selectedEstate?.geoid ?? null,
      limit: 12,
    }),
  );

  const [legacyResponse, evidence] = await Promise.all([
    legacyConciergePost(requestForLegacyRoute),
    evidencePromise,
  ]);

  const payload = (await legacyResponse.json().catch(() => null)) as
    | ConciergeReply
    | { error?: string }
    | null;

  if (!legacyResponse.ok || !payload) {
    return NextResponse.json(payload ?? { error: "The concierge could not respond." }, {
      status: legacyResponse.status || 500,
    });
  }

  return NextResponse.json(
    {
      ...payload,
      evidence,
      evidenceMeta: {
        query: body.message,
        island: body.context.island,
        count: evidence.length,
        kinds: Array.from(new Set(evidence.map((item) => item.kind))),
      },
    },
    {
      status: legacyResponse.status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
