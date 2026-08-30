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

type FirebaseAdminEnvironment = Readonly<Record<string, string | undefined>>;

type FirebaseAdminConfigurationSource =
  | "service_account_json"
  | "individual_service_account"
  | "application_default"
  | "none";

export type FirebaseAdminConfigurationStatus = Readonly<{
  configured: boolean;
  source: FirebaseAdminConfigurationSource;
  incompleteIndividualCredentials: boolean;
}>;

function present(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function applicationDefaultConfigured(env: FirebaseAdminEnvironment) {
  return Boolean(
    present(env.GOOGLE_APPLICATION_CREDENTIALS) ||
      present(env.GCLOUD_PROJECT) ||
      present(env.GOOGLE_CLOUD_PROJECT),
  );
}

export function getFirebaseAdminConfigurationStatus(
  env: FirebaseAdminEnvironment = process.env,
): FirebaseAdminConfigurationStatus {
  const hasJson = Boolean(
    present(env.FIREBASE_SERVICE_ACCOUNT_JSON) ||
      present(env.FIREBASE_ADMIN_SERVICE_ACCOUNT) ||
      present(env.GCP_SERVICE_ACCOUNT_JSON),
  );

  const projectId = env.FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const individual = [
    present(projectId),
    present(env.FIREBASE_CLIENT_EMAIL),
    present(env.FIREBASE_PRIVATE_KEY),
  ];
  const hasAnyIndividual = individual.some(Boolean);
  const hasCompleteIndividual = individual.every(Boolean);
  const hasApplicationDefault = applicationDefaultConfigured(env);

  if (hasJson) {
    return Object.freeze({
      configured: true,
      source: "service_account_json" as const,
      incompleteIndividualCredentials: hasAnyIndividual && !hasCompleteIndividual,
    });
  }

  if (hasCompleteIndividual) {
    return Object.freeze({
      configured: true,
      source: "individual_service_account" as const,
      incompleteIndividualCredentials: false,
    });
  }

  if (hasApplicationDefault) {
    return Object.freeze({
      configured: true,
      source: "application_default" as const,
      incompleteIndividualCredentials: hasAnyIndividual && !hasCompleteIndividual,
    });
  }

  return Object.freeze({
    configured: false,
    source: "none" as const,
    incompleteIndividualCredentials: hasAnyIndividual && !hasCompleteIndividual,
  });
}

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

function readServiceAccount(
  env: FirebaseAdminEnvironment = process.env,
): ServiceAccount | null {
  const jsonSources = [
    ["FIREBASE_SERVICE_ACCOUNT_JSON", env.FIREBASE_SERVICE_ACCOUNT_JSON],
    ["FIREBASE_ADMIN_SERVICE_ACCOUNT", env.FIREBASE_ADMIN_SERVICE_ACCOUNT],
    ["GCP_SERVICE_ACCOUNT_JSON", env.GCP_SERVICE_ACCOUNT_JSON],
  ] as const;

  for (const [name, raw] of jsonSources) {
    if (!present(raw)) continue;

    try {
      return normalizeServiceAccount(
        JSON.parse(raw as string) as ServiceAccountRecord,
        name,
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`${name} does not contain valid JSON.`);
      }
      throw error;
    }
  }

  const projectId = env.FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;
  const hasAnyIndividual = [projectId, clientEmail, privateKey].some((value) =>
    present(value),
  );
  const hasCompleteIndividual = [projectId, clientEmail, privateKey].every(
    (value) => present(value),
  );

  if (hasCompleteIndividual) {
    return normalizeServiceAccount(
      { projectId, clientEmail, privateKey },
      "individual Firebase environment variables",
    );
  }

  if (hasAnyIndividual && !applicationDefaultConfigured(env)) {
    throw new Error(
      "Firebase Admin credentials in individual Firebase environment variables are incomplete. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY together.",
    );
  }

  return null;
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
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT;

  return initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export function hasFirebaseAdminConfiguration() {
  return getFirebaseAdminConfigurationStatus().configured;
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
