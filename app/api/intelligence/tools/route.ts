import { NextResponse } from "next/server";

import {
  listIntelligenceTools,
  publicToolDescriptor,
} from "@/lib/intelligence/tool-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const tools = listIntelligenceTools().map(publicToolDescriptor);
  const categories = Array.from(new Set(tools.map((tool) => tool.category))).sort();

  return NextResponse.json(
    {
      tools,
      categories,
      total: tools.length,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
