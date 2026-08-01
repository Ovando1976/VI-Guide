import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIVE_DAYS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = typeof body?.idToken === "string" ? body.idToken.trim() : "";
  if (!idToken) return NextResponse.json({ error: "ID token required." }, { status: 400 });
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    const session = await getAdminAuth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FIVE_DAYS / 1000,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid sign-in token." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), path: "/" });
  return response;
}
