import { doc, getDoc } from "firebase/firestore";
import { getAnonymousUid, getFirebaseDb } from "../firebase/firebaseClient";
import { mirrorUserRecord } from "../firebase/firestoreStore";
export type AccountRole = "visitor" | "visitor_paid" | "partner" | "admin";

export type AccessLevel = "public" | "visitor_paid" | "partner" | "admin";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  businessName?: string;
  createdAt: string;
};

export type VisitorPass = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  paidAt: string;
  expiresAt: string;
};

const ACCOUNT_KEY = "viNavigatorCurrentAccount";
const VISITOR_PASS_KEY = "viNavigatorVisitorPass";

export const demoAccounts: Record<AccountRole, UserAccount> = {
  visitor: {
    id: "demo-visitor",
    name: "Visitor Demo",
    email: "visitor@example.com",
    role: "visitor",
    createdAt: new Date().toISOString(),
  },
  visitor_paid: {
    id: "demo-paid-visitor",
    name: "Paid Visitor Demo",
    email: "paidvisitor@example.com",
    role: "visitor_paid",
    createdAt: new Date().toISOString(),
  },
  partner: {
    id: "demo-partner",
    name: "Partner Demo",
    email: "partner@example.com",
    role: "partner",
    businessName: "Demo Hotel Partner",
    createdAt: new Date().toISOString(),
  },
  admin: {
    id: "demo-admin",
    name: "Admin Demo",
    email: "admin@example.com",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
};

function emitAccountChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("viNavigatorAccountChanged"));
}

export function getCurrentAccount(): UserAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function setCurrentAccount(account: UserAccount) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  void mirrorUserRecord("accountSessions", account.id, account as unknown as Record<string, unknown>);
  emitAccountChanged();
}

export function signInDemoAccount(role: AccountRole) {
  setCurrentAccount({
    ...demoAccounts[role],
    createdAt: new Date().toISOString(),
  });
}

export function signOutAccount() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCOUNT_KEY);
  emitAccountChanged();
}

export function getVisitorPass(): VisitorPass | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(VISITOR_PASS_KEY) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function hasActiveVisitorPass() {
  const pass = getVisitorPass();
  if (!pass) return false;

  const expires = new Date(pass.expiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export function activateVisitorPass(planId: string, planName: string, amount: number, days: number) {
  if (typeof window === "undefined") return null;

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + days);

  const pass: VisitorPass = {
    id: `visitor-pass-${now.getTime()}`,
    planId,
    planName,
    amount,
    paidAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  window.localStorage.setItem(VISITOR_PASS_KEY, JSON.stringify(pass));
  void mirrorUserRecord("visitorPasses", "current", pass as unknown as Record<string, unknown>);
  signInDemoAccount("visitor_paid");
  emitAccountChanged();

  return pass;
}

export async function syncVisitorPassFromCloud() {
  if (typeof window === "undefined") return null;

  const db = getFirebaseDb();
  if (!db) return null;

  const uid = await getAnonymousUid();
  if (!uid) return null;

  const snapshot = await getDoc(doc(db, "users", uid, "visitorPasses", "current"));

  if (!snapshot.exists()) return null;

  const pass = snapshot.data() as VisitorPass;

  window.localStorage.setItem(VISITOR_PASS_KEY, JSON.stringify(pass));
  signInDemoAccount("visitor_paid");
  emitAccountChanged();

  return pass;
}

export function clearVisitorPass() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VISITOR_PASS_KEY);
  emitAccountChanged();
}

export function canAccess(access: AccessLevel, account = getCurrentAccount()) {
  if (access === "public") return true;

  if (!account) return false;

  if (access === "admin") {
    return account.role === "admin";
  }

  if (account.role === "admin") return true;

  if (access === "partner") {
    return account.role === "partner";
  }

  if (access === "visitor_paid") {
    return account.role === "visitor_paid" || account.role === "partner" || hasActiveVisitorPass();
  }

  return false;
}

export function roleLabel(role?: AccountRole) {
  if (!role) return "Signed out";

  return {
    visitor: "Visitor",
    visitor_paid: "Paid Visitor",
    partner: "Partner",
    admin: "Admin",
  }[role];
}
