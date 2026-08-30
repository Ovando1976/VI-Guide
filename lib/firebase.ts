import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
};

export const hasFirebaseClientConfiguration = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

// The app container can be created while Next.js prerenders public routes.
// Firebase Auth cannot: getAuth() validates the API key immediately. Keep Auth
// browser-only and use only the environment-specific NEXT_PUBLIC_FIREBASE_*
// values configured for the active Vercel environment. Missing configuration
// intentionally disables browser authentication instead of falling back to a
// different Firebase project.
export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth: Auth | null =
  typeof window !== "undefined" && hasFirebaseClientConfiguration
    ? getAuth(firebaseApp)
    : null;
