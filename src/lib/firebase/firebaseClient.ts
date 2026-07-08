import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export async function getAnonymousUid() {
  const auth = getFirebaseAuth();

  if (!auth) return null;

  if (auth.currentUser) return auth.currentUser.uid;

  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();

  if (!auth) {
    throw new Error("Firebase is not configured. Add VITE_FIREBASE_* values first.");
  }

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function signOutFirebaseUser() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function watchFirebaseUser(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();

  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function getCurrentIdToken(forceRefresh = false) {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  if (!user) return null;

  return user.getIdToken(forceRefresh);
}

export async function getCurrentClaims(forceRefresh = false) {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;

  if (!user) return null;

  const token = await user.getIdTokenResult(forceRefresh);
  return token.claims;
}
