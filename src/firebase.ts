// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

import firebaseConfig from "../firebase-applet-config.json";

// Extract your explicit custom Firebase database instance token
const FIRESTORE_DATABASE_ID =
  firebaseConfig.firestoreDatabaseId ||
  "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671";

// 1. Initialize the Core Application Module
export const app = initializeApp(firebaseConfig);

// 2. Initialize Firestore utilizing its matching method signature:
//    initializeFirestore(app, settings, databaseId)
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  FIRESTORE_DATABASE_ID,
);

// 3. Bind downstream auxiliary services
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log("Firebase projectId:", firebaseConfig.projectId);
console.log("Firestore databaseId:", FIRESTORE_DATABASE_ID);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
  };

  console.error("Firestore Error:", errInfo);
  throw new Error(JSON.stringify(errInfo));
}
