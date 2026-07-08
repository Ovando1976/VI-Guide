import { signInAnonymously, type User } from "firebase/auth";

import { firebaseAuth } from "../../lib/firebaseClient";

export function getCurrentVIConnectUser(): User | null {
  return firebaseAuth?.currentUser || null;
}

export function getCurrentVIConnectUid() {
  return firebaseAuth?.currentUser?.uid || "";
}

export async function ensureVIConnectAuth(): Promise<User | null> {
  if (!firebaseAuth) return null;

  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  try {
    const credential = await signInAnonymously(firebaseAuth);
    return credential.user;
  } catch (error) {
    console.warn("VI Connect anonymous auth failed. Using local MVP mode.", error);
    return firebaseAuth.currentUser || null;
  }
}
