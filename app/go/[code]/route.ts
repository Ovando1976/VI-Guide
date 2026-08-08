import { NextRequest, NextResponse } from "next/server";

import { acquisitionDestination } from "@/lib/acquisition-links";

export function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const destination = acquisitionDestination(params.code.toLowerCase());
  if (!destination) {
    return NextResponse.redirect(new URL("/?utm_source=unknown-referral&utm_medium=qr", request.url), 307);
  }

  return NextResponse.redirect(new URL(destination, request.url), 307);
}
