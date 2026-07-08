import { getAnonymousUid } from "../firebase/firebaseClient";

export type VisitorCheckoutPlan = {
  id: string;
  name: string;
  amount: number;
  days: number;
  text: string;
  featured?: boolean;
};

const apiBase = String(import.meta.env.VITE_PAYMENTS_API_BASE_URL || "").replace(/\/$/, "");

export async function startVisitorCheckout(plan: VisitorCheckoutPlan) {
  if (!apiBase) {
    throw new Error(
      "Missing VITE_PAYMENTS_API_BASE_URL. Deploy the Firebase payment function first."
    );
  }

  const uid = await getAnonymousUid();

  if (!uid) {
    throw new Error("Firebase Auth is not configured. Add Firebase env values first.");
  }

  const origin = window.location.origin;

  const response = await fetch(`${apiBase}/createVisitorCheckoutSession`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uid,
      planId: plan.id,
      successUrl: `${origin}/visitor-checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/visitor-checkout?payment=cancelled`,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to start checkout.");
  }

  const data = (await response.json()) as { url?: string };

  if (!data.url) {
    throw new Error("Checkout session did not return a Stripe URL.");
  }

  window.location.assign(data.url);
}
