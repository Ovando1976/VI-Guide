import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import type { UserProfile } from "../types";
import { DEFAULT_ISLAND } from "./constants/islands";

const ADMIN_EMAILS = new Set(["ovandorawlins@gmail.com"]);

function createUserProfile(firebaseUser: User): UserProfile {
  const email = firebaseUser.email ?? "";

  return {
    uid: firebaseUser.uid,
    email,
    displayName: firebaseUser.displayName || "Guest",
    photoURL: firebaseUser.photoURL || "",
    selectedIsland: DEFAULT_ISLAND,
    role: ADMIN_EMAILS.has(email.toLowerCase()) ? "admin" : "user",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export async function completeRedirectSignIn() {
  await getRedirectResult(auth);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

export async function signOutOfApp() {
  await auth.signOut();
}

export function startAppAuth({
  setUser,
  setProfile,
}: {
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
}) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
        return;
      }

      const newProfile = createUserProfile(firebaseUser);
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  });
}
