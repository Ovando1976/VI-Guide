import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been replaced by /api/stripe/create-intent.",
    },
    { status: 410 },
  );
}
