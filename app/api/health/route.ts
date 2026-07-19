import { NextResponse } from "next/server";
import { hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "vi-guide",
    firebaseAdminConfigured: hasFirebaseAdminConfiguration(),
    timestamp: new Date().toISOString(),
  });
}

