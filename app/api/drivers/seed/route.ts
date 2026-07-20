import { NextResponse } from "next/server";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

export async function POST() {
  try {
    await requireSession(["admin"]);
    return NextResponse.json(
      {
        error: "Demo driver seeding is disabled. Import reviewed Commission credentials, association memberships, and fleet records through the taxi operations workflow.",
        code: "REVIEWED_TAXI_RECORDS_REQUIRED",
      },
      { status: 410 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 });
  }
}
