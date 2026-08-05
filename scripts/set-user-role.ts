import "dotenv/config";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { normalizeManagedListingIds } from "../lib/merchant-access";

type ServiceAccountInput = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function loadCredential(): ServiceAccount | null {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ??
    process.env.GCP_SERVICE_ACCOUNT_JSON;

  if (raw) {
    const value = JSON.parse(raw) as ServiceAccountInput;

    return {
      projectId: value.projectId ?? value.project_id,
      clientEmail: value.clientEmail ?? value.client_email,
      privateKey: (value.privateKey ?? value.private_key)?.replace(
        /\\n/g,
        "\n",
      ),
    };
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];
  const scope = process.argv[4];
  const allowedRoles = [
    "rider",
    "driver",
    "merchant",
    "dispatcher",
    "admin",
  ];

  if (!email || !role || !allowedRoles.includes(role)) {
    throw new Error(
      "Usage: npm run auth:set-role -- user@example.com rider|driver|merchant|dispatcher|admin [driverId|listing-id-1,listing-id-2]",
    );
  }

  if (role === "driver" && !scope) {
    throw new Error("A driverId is required for the driver role.");
  }

  const listingIds =
    role === "merchant"
      ? normalizeManagedListingIds(
          String(scope ?? "")
            .split(",")
            .map((value) => value.trim()),
        )
      : [];

  if (role === "merchant" && !listingIds.length) {
    throw new Error(
      "At least one comma-separated listing ID is required for the merchant role.",
    );
  }

  const serviceAccount = loadCredential();

  const app =
    getApps()[0] ??
    initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId:
        serviceAccount?.projectId ??
        process.env.FIREBASE_PROJECT_ID ??
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

  const adminAuth = getAuth(app);
  const user = await adminAuth.getUserByEmail(email);

  await adminAuth.setCustomUserClaims(user.uid, {
    role,
    ...(role === "driver" ? { driverId: scope } : {}),
    ...(role === "merchant" ? { listingIds } : {}),
  });

  const accessSummary =
    role === "driver"
      ? ` for driver ${scope}`
      : role === "merchant"
        ? ` for ${listingIds.length} listing${listingIds.length === 1 ? "" : "s"}`
        : "";

  console.log(
    `Updated ${email} to ${role}${accessSummary}. The user must sign out and back in.`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Failed to update user role.",
  );
  process.exit(1);
});
