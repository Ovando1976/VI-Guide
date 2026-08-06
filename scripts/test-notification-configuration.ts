import assert from "node:assert/strict";

import {
  isValidSenderIdentity,
  normalizeConfigurationEmails,
  notificationConfigurationStatus,
} from "../lib/notifications/notification-configuration";

assert.deepEqual(
  normalizeConfigurationEmails(
    " Ops@Example.com,ops@example.com,alerts@example.com,invalid ",
  ),
  ["ops@example.com", "alerts@example.com"],
);
assert.deepEqual(normalizeConfigurationEmails(null), []);

assert.equal(isValidSenderIdentity("bookings@example.com"), true);
assert.equal(
  isValidSenderIdentity("VI Guide <bookings@example.com>"),
  true,
);
assert.equal(isValidSenderIdentity("VI Guide bookings@example.com"), false);
assert.equal(isValidSenderIdentity("not-an-email"), false);
assert.equal(isValidSenderIdentity("VI Guide <invalid>"), false);

assert.deepEqual(
  notificationConfigurationStatus({
    firebaseAdminConfigured: true,
    resendApiKey: "re_test_key",
    emailFrom: "VI Guide <bookings@example.com>",
    operationsEmails: "ops@example.com,alerts@example.com",
    cronSecret: "a-secure-cron-secret-value",
    appUrl: "https://vi-guide.vercel.app",
  }),
  {
    ready: true,
    firebaseAdminConfigured: true,
    emailProviderConfigured: true,
    senderConfigured: true,
    operationsRecipientsConfigured: true,
    cronSecretConfigured: true,
    appUrlConfigured: true,
    operationsRecipientCount: 2,
    missing: [],
  },
);

assert.deepEqual(
  notificationConfigurationStatus({
    firebaseAdminConfigured: false,
    resendApiKey: "",
    emailFrom: "not-an-email",
    operationsEmails: "invalid",
    cronSecret: "short",
    appUrl: "http://localhost:3000",
  }),
  {
    ready: false,
    firebaseAdminConfigured: false,
    emailProviderConfigured: false,
    senderConfigured: false,
    operationsRecipientsConfigured: false,
    cronSecretConfigured: false,
    appUrlConfigured: false,
    operationsRecipientCount: 0,
    missing: [
      "Firebase Admin",
      "Resend API key",
      "sender identity",
      "operations recipients",
      "cron secret",
    ],
  },
);

assert.equal(
  notificationConfigurationStatus({
    firebaseAdminConfigured: true,
    resendApiKey: "re_test_key",
    emailFrom: "sender@example.com",
    operationsEmails: "ops@example.com",
    cronSecret: "1234567890abcdef",
    appUrl: "https://vi-guide.vercel.app/",
  }).appUrlConfigured,
  true,
);
assert.equal(
  notificationConfigurationStatus({
    firebaseAdminConfigured: true,
    resendApiKey: "re_test_key",
    emailFrom: "sender@example.com",
    operationsEmails: "ops@example.com",
    cronSecret: "1234567890abcdef",
    appUrl: "https://vi-guide.vercel.app/path",
  }).appUrlConfigured,
  false,
);

console.log("Notification configuration tests passed.");
