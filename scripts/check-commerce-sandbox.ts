import { config as loadEnvironment } from "dotenv";

import { validateCommerceSandboxEnvironment } from "../lib/payments/commerce-sandbox-safety";

const environmentPath = readEnvironmentPath(process.argv.slice(2));
if (environmentPath) {
  const loaded = loadEnvironment({ path: environmentPath, override: false });
  if (loaded.error) {
    console.error(
      JSON.stringify(
        {
          result: "blocked",
          errors: [`Unable to load sandbox environment file: ${environmentPath}.`],
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) {
  const result = validateCommerceSandboxEnvironment({
    confirmation: process.env.VI_GUIDE_COMMERCE_SANDBOX_CONFIRMATION,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_COMMERCE_WEBHOOK_SECRET,
    firebaseProjectId:
      process.env.FIREBASE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    expectedFirebaseProjectId:
      process.env.VI_GUIDE_SANDBOX_FIREBASE_PROJECT_ID,
    productionFirebaseProjectId:
      process.env.VI_GUIDE_PRODUCTION_FIREBASE_PROJECT_ID,
    appUrl:
      process.env.VI_GUIDE_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    productionAppUrl: process.env.VI_GUIDE_PRODUCTION_APP_URL,
    platformFeeBps: process.env.VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS,
  });

  if (!result.ok) {
    console.error(
      JSON.stringify(
        {
          result: "blocked",
          mode: "sandbox-preflight",
          errors: result.errors,
          externalWrites: 0,
          stripeOperations: 0,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          result: "passed",
          mode: "sandbox-preflight",
          configuration: result.configuration,
          checks: result.checks,
          externalWrites: 0,
          stripeOperations: 0,
          nextAction:
            "Run the isolated Stripe sandbox Checkout and full-refund procedure documented in docs/commerce-sandbox-runbook.md.",
        },
        null,
        2,
      ),
    );
  }
}

function readEnvironmentPath(args: string[]) {
  const inline = args.find((argument) => argument.startsWith("--env="));
  if (inline) return inline.slice("--env=".length).trim();

  const index = args.indexOf("--env");
  if (index >= 0) return String(args[index + 1] ?? "").trim();

  return "";
}
