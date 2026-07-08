import {
  getCurrentClaims,
  getCurrentIdToken,
  signInWithGoogle,
} from "../firebase/firebaseClient";

const apiBase = String(import.meta.env.VITE_PAYMENTS_API_BASE_URL || "").replace(/\/$/, "");

export type AssignableRole = "visitor" | "visitor_paid" | "partner" | "admin";

export async function ensureGoogleSession() {
  const token = await getCurrentIdToken(false);
  if (token) return token;

  await signInWithGoogle();

  const nextToken = await getCurrentIdToken(true);

  if (!nextToken) {
    throw new Error("Unable to create Firebase session.");
  }

  return nextToken;
}

export async function assignUserRole(email: string, role: AssignableRole) {
  if (!apiBase) {
    throw new Error("Missing VITE_PAYMENTS_API_BASE_URL.");
  }

  const token = await ensureGoogleSession();

  const response = await fetch(`${apiBase}/setUserRole`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, role }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to assign role.");
  }

  return response.json() as Promise<{
    ok: boolean;
    uid: string;
    email: string;
    role: AssignableRole;
    claims: Record<string, unknown>;
  }>;
}

export async function refreshMyClaims() {
  const claims = await getCurrentClaims(true);
  return claims || {};
}
