export type NotificationConfigurationInput = {
  firebaseAdminConfigured: boolean;
  resendApiKey?: unknown;
  emailFrom?: unknown;
  operationsEmails?: unknown;
  cronSecret?: unknown;
  appUrl?: unknown;
};

export type NotificationConfigurationStatus = {
  ready: boolean;
  firebaseAdminConfigured: boolean;
  emailProviderConfigured: boolean;
  senderConfigured: boolean;
  operationsRecipientsConfigured: boolean;
  cronSecretConfigured: boolean;
  appUrlConfigured: boolean;
  operationsRecipientCount: number;
  missing: string[];
};

export function notificationConfigurationStatus({
  firebaseAdminConfigured,
  resendApiKey,
  emailFrom,
  operationsEmails,
  cronSecret,
  appUrl,
}: NotificationConfigurationInput): NotificationConfigurationStatus {
  const emailProviderConfigured = Boolean(clean(resendApiKey, 500));
  const senderConfigured = Boolean(clean(emailFrom, 320));
  const operationsRecipientCount = normalizeConfigurationEmails(
    operationsEmails,
  ).length;
  const operationsRecipientsConfigured = operationsRecipientCount > 0;
  const cronSecretConfigured = clean(cronSecret, 500).length >= 16;
  const appUrlConfigured = isSafeHttpsOrigin(appUrl);
  const missing: string[] = [];

  if (!firebaseAdminConfigured) missing.push("Firebase Admin");
  if (!emailProviderConfigured) missing.push("Resend API key");
  if (!senderConfigured) missing.push("sender identity");
  if (!operationsRecipientsConfigured) missing.push("operations recipients");
  if (!cronSecretConfigured) missing.push("cron secret");

  return {
    ready:
      firebaseAdminConfigured &&
      emailProviderConfigured &&
      senderConfigured &&
      operationsRecipientsConfigured &&
      cronSecretConfigured,
    firebaseAdminConfigured,
    emailProviderConfigured,
    senderConfigured,
    operationsRecipientsConfigured,
    cronSecretConfigured,
    appUrlConfigured,
    operationsRecipientCount,
    missing,
  };
}

export function normalizeConfigurationEmails(value: unknown) {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      candidates
        .map((candidate) =>
          typeof candidate === "string"
            ? candidate.trim().toLowerCase().slice(0, 220)
            : "",
        )
        .filter((candidate) => /^\S+@\S+\.\S+$/.test(candidate)),
    ),
  ).slice(0, 20);
}

function isSafeHttpsOrigin(value: unknown) {
  const candidate = clean(value, 500);
  if (!candidate) return false;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" && parsed.origin === candidate.replace(/\/$/, "");
  } catch {
    return false;
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
