import { doc, getDoc } from "firebase/firestore";

import {
  getCurrentClaims,
  getFirebaseAuth,
  getFirebaseDb,
} from "../firebase/firebaseClient";
import {
  getCurrentAccount,
  getVisitorPass,
  hasActiveVisitorPass,
  roleLabel,
  type AccessLevel,
  type UserAccount,
  type VisitorPass,
} from "./userAccount";

export type CloudAccessSnapshot = {
  loading: boolean;
  uid: string;
  email: string;
  displayName: string;
  localAccount: UserAccount | null;
  localVisitorPass: VisitorPass | null;
  cloudVisitorPass: VisitorPass | null;
  claims: Record<string, unknown>;
  admin: boolean;
  partner: boolean;
  visitorPaid: boolean;
  label: string;
};

function isTrue(value: unknown) {
  return value === true || value === "true";
}

function claimRole(claims: Record<string, unknown>) {
  return typeof claims.role === "string" ? claims.role : "";
}

function validPass(pass: VisitorPass | null) {
  if (!pass) return false;
  const expires = new Date(pass.expiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export async function readCloudVisitorPass(uid: string) {
  const db = getFirebaseDb();

  if (!db || !uid) return null;

  const snapshot = await getDoc(doc(db, "users", uid, "visitorPasses", "current"));

  if (!snapshot.exists()) return null;

  return snapshot.data() as VisitorPass;
}

export async function getCloudAccessSnapshot(): Promise<CloudAccessSnapshot> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser || null;
  const claims = ((await getCurrentClaims(true)) || {}) as Record<string, unknown>;
  const cloudVisitorPass = user ? await readCloudVisitorPass(user.uid) : null;
  const localAccount = getCurrentAccount();
  const localVisitorPass = getVisitorPass();

  const admin = isTrue(claims.admin) || claimRole(claims) === "admin";
  const partner =
    admin || isTrue(claims.partner) || claimRole(claims) === "partner";
  const visitorPaid =
    admin ||
    partner ||
    isTrue(claims.visitor_paid) ||
    claimRole(claims) === "visitor_paid" ||
    validPass(cloudVisitorPass) ||
    hasActiveVisitorPass();

  let label = "Signed out";

  if (admin) label = "Admin";
  else if (partner) label = "Partner";
  else if (visitorPaid) label = "Paid Visitor";
  else if (localAccount) label = roleLabel(localAccount.role);
  else if (user) label = "Firebase Visitor";

  return {
    loading: false,
    uid: user?.uid || "",
    email: user?.email || localAccount?.email || "",
    displayName: user?.displayName || localAccount?.name || "",
    localAccount,
    localVisitorPass,
    cloudVisitorPass,
    claims,
    admin,
    partner,
    visitorPaid,
    label,
  };
}

export function canAccessSnapshot(access: AccessLevel, snapshot: CloudAccessSnapshot) {
  if (access === "public") return true;
  if (access === "admin") return snapshot.admin;
  if (access === "partner") return snapshot.partner;
  if (access === "visitor_paid") return snapshot.visitorPaid;

  return false;
}
