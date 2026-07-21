import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const configuredApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

/**
 * Firebase's browser SDK is imported by client components that Next.js also
 * evaluates while prerendering. A missing environment variable must therefore
 * not crash the production build. These build-safe values are never treated as
 * a configured backend; they only allow the client bundle to be generated.
 */
const buildSafeProjectId = "vi-guide-build-safe";
const buildSafeApiKey = "AIzaSyD4mmYBuildSafeKeyForVIGuide000000";

export const hasFirebaseClientConfiguration = Boolean(
  configuredApiKey &&
    configuredProjectId &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
);

const firebaseConfig = {
  apiKey: configuredApiKey || buildSafeApiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
    `${buildSafeProjectId}.firebaseapp.com`,
  projectId: configuredProjectId || buildSafeProjectId,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ||
    "1:000000000000:web:0000000000000000000000",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    `${buildSafeProjectId}.appspot.com`,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "000000000000",
};

export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
