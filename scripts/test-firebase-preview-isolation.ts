import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../lib/firebase.ts", import.meta.url),
  "utf8",
);

const requiredEnvironmentKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
] as const;

for (const key of requiredEnvironmentKeys) {
  assert.match(
    source,
    new RegExp(`process\\.env\\.${key}`),
    `Firebase client configuration must read ${key} from the active environment.`,
  );
}

const forbiddenProductionFallbacks = [
  "productionFirebaseWebConfig",
  "usvi-db1e4.firebaseapp.com",
  "usvi-db1e4.firebasestorage.app",
  "AIzaSy",
] as const;

for (const value of forbiddenProductionFallbacks) {
  assert.ok(
    !source.includes(value),
    `Firebase client configuration must not embed production fallback value: ${value}`,
  );
}

assert.match(
  source,
  /typeof window !== "undefined" && hasFirebaseClientConfiguration/,
  "Browser authentication must remain disabled when Firebase configuration is incomplete.",
);

console.log("Firebase preview-isolation contract passed.");
