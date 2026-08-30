import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web configuration is intentionally public client metadata. These
// defaults mirror the currently deployed production Firebase app so Preview
// deployments stay sign-in capable even when Vercel branch scoping omits the
// NEXT_PUBLIC_FIREBASE_* values. Environment variables still take precedence,
// so the project can be rotated or pointed at a different Firebase app without
// another code change. Never place Firebase Admin/service-account credentials
// in this file.
const productionFirebaseWebConfig = {
  apiKey: "AIzaSyAdnaBxh2jqoFdcpkeTAgHDZqM47EYVVv0",
  authDomain: "usvi-db1e4.firebaseapp.com",
  projectId: "usvi-db1e4",
  appId: "1:274029322569:web:23a2a96ba54bb7496ffa98",
  storageBucket: "usvi-db1e4.firebasestorage.app",
  messagingSenderId: "274029322569",
} as const;

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    productionFirebaseWebConfig.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
    productionFirebaseWebConfig.authDomain,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    productionFirebaseWebConfig.projectId,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ||
    productionFirebaseWebConfig.appId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    productionFirebaseWebConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
    productionFirebaseWebConfig.messagingSenderId,
};

export const hasFirebaseClientConfiguration = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

// The app container can be created while Next.js prerenders public routes.
// Firebase Auth cannot: getAuth() validates the API key immediately. Keep Auth
// browser-only. Preview may use the canonical production Firebase web metadata
// above, while explicit NEXT_PUBLIC_FIREBASE_* values always win when present.
export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth: Auth | null =
  typeof window !== "undefined" && hasFirebaseClientConfiguration
    ? getAuth(firebaseApp)
    : null;
