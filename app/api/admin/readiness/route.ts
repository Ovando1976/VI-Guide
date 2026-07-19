import { NextResponse } from "next/server";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

type Check = { id: string; label: string; ready: boolean; detail: string };

export async function GET() {
  try {
    await requireSession(["admin"]);
    const checks: Check[] = [
      { id: "firebase-admin", label: "Firebase Admin", ready: hasFirebaseAdminConfiguration(), detail: hasFirebaseAdminConfiguration() ? "Server credentials detected." : "Firebase Admin credentials are missing." },
      { id: "stripe-secret", label: "Stripe live secret", ready: Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_")), detail: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "Live Stripe key detected." : "A Stripe live secret key is not configured." },
      { id: "stripe-webhook", label: "Stripe webhook signing", ready: Boolean(process.env.STRIPE_WEBHOOK_SECRET), detail: process.env.STRIPE_WEBHOOK_SECRET ? "Webhook signing secret detected." : "Stripe webhook signing secret is missing." },
      { id: "app-url", label: "Production URL", ready: Boolean(process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")), detail: process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ? process.env.NEXT_PUBLIC_APP_URL : "NEXT_PUBLIC_APP_URL must be an HTTPS production domain." },
      { id: "support", label: "Customer support", ready: Boolean(process.env.SUPPORT_EMAIL && process.env.SUPPORT_PHONE), detail: process.env.SUPPORT_EMAIL && process.env.SUPPORT_PHONE ? "Support email and phone detected." : "SUPPORT_EMAIL and SUPPORT_PHONE are required." },
    ];

    if (hasFirebaseAdminConfiguration()) {
      const db = getAdminDb();
      const [tariffs, associations, drivers, vehicles] = await Promise.all([
        db.collection("taxiTariffs").where("status", "==", "active").get(),
        db.collection("taxiAssociations").where("status", "==", "active").get(),
        db.collection("drivers").where("authorizationStatus", "==", "active").where("verified", "==", true).get(),
        db.collection("vehicles").where("active", "==", true).get(),
      ]);
      checks.push(
        { id: "tariffs", label: "Official tariffs", ready: tariffs.size > 0, detail: `${tariffs.size} active tariff document${tariffs.size === 1 ? "" : "s"}.` },
        { id: "associations", label: "Taxi associations", ready: associations.size > 0, detail: `${associations.size} active association${associations.size === 1 ? "" : "s"}.` },
        { id: "drivers", label: "Credentialed drivers", ready: drivers.size >= 3, detail: `${drivers.size} reviewed active driver${drivers.size === 1 ? "" : "s"}; pilot minimum is 3.` },
        { id: "vehicles", label: "Active fleet", ready: vehicles.size >= 3, detail: `${vehicles.size} active vehicle${vehicles.size === 1 ? "" : "s"}; pilot minimum is 3.` },
      );
    }

    return NextResponse.json({ ready: checks.every((check) => check.ready), checks, checkedAt: new Date().toISOString() });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to evaluate launch readiness." }, { status: 500 });
  }
}

