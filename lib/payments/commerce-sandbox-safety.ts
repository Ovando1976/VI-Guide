export const COMMERCE_SANDBOX_CONFIRMATION =
  "VI_GUIDE_COMMERCE_SANDBOX_ONLY";

export type CommerceSandboxEnvironmentInput = {
  confirmation?: unknown;
  stripeSecretKey?: unknown;
  stripePublishableKey?: unknown;
  stripeWebhookSecret?: unknown;
  firebaseProjectId?: unknown;
  expectedFirebaseProjectId?: unknown;
  productionFirebaseProjectId?: unknown;
  appUrl?: unknown;
  productionAppUrl?: unknown;
  platformFeeBps?: unknown;
};

export type CommerceSandboxConfiguration = {
  stripeMode: "test";
  stripeKeyKind: "restricted" | "secret";
  firebaseProjectId: string;
  appOrigin: string;
  platformFeeBps: number;
};

export type CommerceSandboxSafetyResult =
  | {
      ok: true;
      configuration: CommerceSandboxConfiguration;
      checks: string[];
    }
  | {
      ok: false;
      errors: string[];
    };

const SANDBOX_PROJECT_MARKER = /(?:^|[-_.])(sandbox|test|testing|demo|emulator)(?:$|[-_.])/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const KNOWN_PRODUCTION_HOSTS = new Set(["vi-guide.vercel.app"]);

export function validateCommerceSandboxEnvironment(
  input: CommerceSandboxEnvironmentInput,
): CommerceSandboxSafetyResult {
  const errors: string[] = [];
  const confirmation = clean(input.confirmation);
  const stripeSecretKey = clean(input.stripeSecretKey);
  const stripePublishableKey = clean(input.stripePublishableKey);
  const stripeWebhookSecret = clean(input.stripeWebhookSecret);
  const firebaseProjectId = clean(input.firebaseProjectId);
  const expectedFirebaseProjectId = clean(input.expectedFirebaseProjectId);
  const productionFirebaseProjectId = clean(input.productionFirebaseProjectId);
  const appUrl = clean(input.appUrl);
  const productionAppUrl = clean(input.productionAppUrl);
  const platformFeeBps = parseFeeBps(input.platformFeeBps);

  if (confirmation !== COMMERCE_SANDBOX_CONFIRMATION) {
    errors.push(
      `VI_GUIDE_COMMERCE_SANDBOX_CONFIRMATION must equal ${COMMERCE_SANDBOX_CONFIRMATION}.`,
    );
  }

  const stripeKeyKind = stripeSecretKey.startsWith("rk_test_")
    ? "restricted"
    : stripeSecretKey.startsWith("sk_test_")
      ? "secret"
      : null;
  if (!/^(?:rk|sk)_test_[A-Za-z0-9]+$/.test(stripeSecretKey)) {
    errors.push(
      "STRIPE_SECRET_KEY must be a Stripe test-mode key beginning with rk_test_ or sk_test_. Live keys are never accepted.",
    );
  }
  if (!/^pk_test_[A-Za-z0-9]+$/.test(stripePublishableKey)) {
    errors.push(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe test-mode key beginning with pk_test_.",
    );
  }
  if (!/^whsec_[A-Za-z0-9]+$/.test(stripeWebhookSecret)) {
    errors.push(
      "STRIPE_COMMERCE_WEBHOOK_SECRET must be a webhook signing secret from the isolated sandbox endpoint or Stripe CLI listener.",
    );
  }

  if (!firebaseProjectId || !expectedFirebaseProjectId) {
    errors.push(
      "FIREBASE_PROJECT_ID and VI_GUIDE_SANDBOX_FIREBASE_PROJECT_ID are both required.",
    );
  } else {
    if (firebaseProjectId !== expectedFirebaseProjectId) {
      errors.push(
        "FIREBASE_PROJECT_ID must exactly match VI_GUIDE_SANDBOX_FIREBASE_PROJECT_ID.",
      );
    }
    if (!SANDBOX_PROJECT_MARKER.test(firebaseProjectId)) {
      errors.push(
        "The Firebase project ID must contain an explicit sandbox, test, demo, or emulator marker.",
      );
    }
    if (
      productionFirebaseProjectId &&
      firebaseProjectId === productionFirebaseProjectId
    ) {
      errors.push(
        "The sandbox Firebase project must not match VI_GUIDE_PRODUCTION_FIREBASE_PROJECT_ID.",
      );
    }
  }

  const appOrigin = validateSandboxAppUrl({
    appUrl,
    productionAppUrl,
    errors,
  });

  if (platformFeeBps === null) {
    errors.push(
      "VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS must be a whole number from 0 through 10000 for a sandbox run.",
    );
  }

  if (errors.length > 0 || !stripeKeyKind || !appOrigin || platformFeeBps === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    configuration: {
      stripeMode: "test",
      stripeKeyKind,
      firebaseProjectId,
      appOrigin,
      platformFeeBps,
    },
    checks: [
      "explicit sandbox confirmation present",
      "Stripe secret key is test mode",
      "Stripe publishable key is test mode",
      "webhook signing secret present",
      "Firebase project is explicitly isolated",
      "application origin is non-production",
      "platform fee policy is deterministic",
    ],
  };
}

function validateSandboxAppUrl(input: {
  appUrl: string;
  productionAppUrl: string;
  errors: string[];
}) {
  if (!input.appUrl) {
    input.errors.push("VI_GUIDE_APP_URL is required for a sandbox run.");
    return null;
  }

  let sandboxUrl: URL;
  try {
    sandboxUrl = new URL(input.appUrl);
  } catch {
    input.errors.push("VI_GUIDE_APP_URL must be a valid absolute URL.");
    return null;
  }

  const hostname = sandboxUrl.hostname.toLowerCase();
  const loopback = LOOPBACK_HOSTS.has(hostname);
  const markedSandboxHost = SANDBOX_PROJECT_MARKER.test(hostname);
  if (!loopback && sandboxUrl.protocol !== "https:") {
    input.errors.push(
      "A remote sandbox VI_GUIDE_APP_URL must use HTTPS. HTTP is allowed only on loopback hosts.",
    );
  }
  if (KNOWN_PRODUCTION_HOSTS.has(hostname)) {
    input.errors.push("The production VI Guide hostname is never accepted for sandbox execution.");
  }
  if (!loopback && !markedSandboxHost) {
    input.errors.push(
      "A remote sandbox hostname must contain an explicit sandbox, test, demo, or emulator marker.",
    );
  }

  if (input.productionAppUrl) {
    try {
      const productionOrigin = new URL(input.productionAppUrl).origin;
      if (sandboxUrl.origin === productionOrigin) {
        input.errors.push(
          "VI_GUIDE_APP_URL must not match VI_GUIDE_PRODUCTION_APP_URL.",
        );
      }
    } catch {
      input.errors.push("VI_GUIDE_PRODUCTION_APP_URL must be a valid absolute URL when set.");
    }
  }

  return sandboxUrl.origin;
}

function parseFeeBps(value: unknown) {
  const raw = clean(value);
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 10_000
    ? parsed
    : null;
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
