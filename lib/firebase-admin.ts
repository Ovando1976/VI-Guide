
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

type ServiceAccountRecord = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function normalizeServiceAccount(
  value: ServiceAccountRecord,
  source: string,
): ServiceAccount {
  const projectId = value.projectId ?? value.project_id;
  const clientEmail = value.clientEmail ?? value.client_email;
  const privateKey = value.privateKey ?? value.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(`Firebase Admin credentials in ${source} are incomplete.`);
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

function readServiceAccount(): ServiceAccount | null {
  const jsonSources = [
    ["FIREBASE_SERVICE_ACCOUNT_JSON", process.env.FIREBASE_SERVICE_ACCOUNT_JSON],
    ["FIREBASE_ADMIN_SERVICE_ACCOUNT", process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT],
    ["GCP_SERVICE_ACCOUNT_JSON", process.env.GCP_SERVICE_ACCOUNT_JSON],
  ] as const;

  for (const [name, raw] of jsonSources) {
    if (!raw) continue;

    try {
      return normalizeServiceAccount(
        JSON.parse(raw) as ServiceAccountRecord,
        name,
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`${name} does not contain valid JSON.`);
      }
      throw error;
    }
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // A project id by itself is valid when Application Default Credentials are
  // supplied through GOOGLE_APPLICATION_CREDENTIALS. Only choose the explicit
  // service-account path when email/key material is present.
  if (!clientEmail && !privateKey) return null;

  return normalizeServiceAccount(
    { projectId, clientEmail, privateKey },
    "individual Firebase environment variables",
  );
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = readServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.GCLOUD_PROJECT;

  return initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export function hasFirebaseAdminConfiguration() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ||
      process.env.GCP_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT,
  );
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
