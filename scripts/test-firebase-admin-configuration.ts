import assert from "node:assert/strict";

import { getFirebaseAdminConfigurationStatus } from "../lib/firebase-admin";

function status(env: Readonly<Record<string, string | undefined>>) {
  return getFirebaseAdminConfigurationStatus(env);
}

assert.deepEqual(status({}), {
  configured: false,
  source: "none",
  incompleteIndividualCredentials: false,
});

assert.deepEqual(status({ FIREBASE_PROJECT_ID: "project-only" }), {
  configured: false,
  source: "none",
  incompleteIndividualCredentials: true,
});

assert.deepEqual(
  status({
    FIREBASE_PROJECT_ID: "project",
    FIREBASE_CLIENT_EMAIL: "service@example.com",
    FIREBASE_PRIVATE_KEY: "private-key",
  }),
  {
    configured: true,
    source: "individual_service_account",
    incompleteIndividualCredentials: false,
  },
);

assert.deepEqual(
  status({ FIREBASE_SERVICE_ACCOUNT_JSON: '{"project_id":"project"}' }),
  {
    configured: true,
    source: "service_account_json",
    incompleteIndividualCredentials: false,
  },
);

assert.deepEqual(
  status({
    FIREBASE_PROJECT_ID: "project-only",
    GOOGLE_APPLICATION_CREDENTIALS: "/tmp/service-account.json",
  }),
  {
    configured: true,
    source: "application_default",
    incompleteIndividualCredentials: true,
  },
);

assert.deepEqual(status({ GCLOUD_PROJECT: "managed-project" }), {
  configured: true,
  source: "application_default",
  incompleteIndividualCredentials: false,
});

console.log("Firebase Admin configuration detection: passed");
