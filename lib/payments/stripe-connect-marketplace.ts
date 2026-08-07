import { createHash } from "node:crypto";

import { getStripe } from "@/lib/stripe";

const STRIPE_ACCOUNTS_V2_VERSION = "2026-07-29.preview";
const STRIPE_ACCOUNTS_V2_BASE = "https://api.stripe.com/v2/core/accounts";

export type MarketplaceTransferCapabilityStatus =
  | "active"
  | "pending"
  | "restricted"
  | "inactive"
  | "unknown";

export type MarketplaceRecipientAccount = {
  id: string;
  object?: string;
  contact_email?: string | null;
  display_name?: string | null;
  dashboard?: string | null;
  livemode?: boolean;
  configuration?: {
    recipient?: {
      capabilities?: {
        stripe_balance?: {
          stripe_transfers?: {
            status?: string | null;
            status_details?: unknown[];
          };
        };
      };
    };
  };
  requirements?: unknown;
  future_requirements?: unknown;
  defaults?: {
    responsibilities?: {
      fees_collector?: string | null;
      losses_collector?: string | null;
      requirements_collector?: string | null;
    };
  };
  metadata?: Record<string, string>;
};

export class StripeMarketplaceConnectError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string | null = null,
  ) {
    super(message);
  }
}

export async function createMarketplaceRecipientAccount(input: {
  merchantUid: string;
  email: string;
  displayName: string;
}) {
  const merchantUid = clean(input.merchantUid, 180);
  const email = normalizeEmail(input.email);
  const displayName = clean(input.displayName, 120) || "VI Guide merchant";
  if (!merchantUid || !email) {
    throw new StripeMarketplaceConnectError(
      "A merchant account and email are required for Stripe payout setup.",
      400,
      "merchant_identity_missing",
    );
  }

  return stripeAccountsV2Request<MarketplaceRecipientAccount>(
    STRIPE_ACCOUNTS_V2_BASE,
    {
      method: "POST",
      idempotencyKey: `vi-guide-marketplace-account-${digest(merchantUid).slice(0, 40)}`,
      body: {
        contact_email: email,
        display_name: displayName,
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        dashboard: "express",
        identity: {
          country: "us",
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: {
                  requested: true,
                },
              },
            },
          },
        },
        metadata: {
          viGuideMerchantUid: merchantUid,
          source: "vi-guide-marketplace",
        },
        include: [
          "configuration.recipient",
          "defaults",
          "identity",
          "requirements",
        ],
      },
    },
  );
}

export async function retrieveMarketplaceRecipientAccount(accountId: string) {
  const normalizedAccountId = clean(accountId, 220);
  if (!/^acct_[A-Za-z0-9]+$/.test(normalizedAccountId)) {
    throw new StripeMarketplaceConnectError(
      "The stored Stripe connected account ID is invalid.",
      400,
      "invalid_connected_account",
    );
  }

  const params = new URLSearchParams();
  [
    "configuration.recipient",
    "defaults",
    "identity",
    "requirements",
    "future_requirements",
  ].forEach((value, index) => params.set(`include[${index}]`, value));

  return stripeAccountsV2Request<MarketplaceRecipientAccount>(
    `${STRIPE_ACCOUNTS_V2_BASE}/${encodeURIComponent(normalizedAccountId)}?${params.toString()}`,
    { method: "GET" },
  );
}

export function marketplaceTransferCapabilityStatus(
  account: MarketplaceRecipientAccount | null | undefined,
): MarketplaceTransferCapabilityStatus {
  const raw = clean(
    account?.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers?.status,
    40,
  ).toLowerCase();
  if (raw === "active") return "active";
  if (raw === "pending") return "pending";
  if (raw === "restricted") return "restricted";
  if (raw === "inactive") return "inactive";
  return "unknown";
}

export function marketplaceRecipientIsTransferReady(
  account: MarketplaceRecipientAccount | null | undefined,
) {
  return marketplaceTransferCapabilityStatus(account) === "active";
}

export async function createMarketplaceOnboardingLink(input: {
  accountId: string;
  origin: string;
}) {
  const accountId = clean(input.accountId, 220);
  const origin = normalizeHttpsOrigin(input.origin);
  if (!accountId || !origin) {
    throw new StripeMarketplaceConnectError(
      "Unable to create a safe Stripe onboarding destination.",
      400,
      "invalid_onboarding_destination",
    );
  }

  return getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/merchant/payouts?connect=refresh`,
    return_url: `${origin}/merchant/payouts?connect=returned`,
    type: "account_onboarding",
    collection_options: {
      fields: "eventually_due",
    },
  });
}

export async function createMarketplaceExpressDashboardLink(accountId: string) {
  const normalizedAccountId = clean(accountId, 220);
  if (!normalizedAccountId) {
    throw new StripeMarketplaceConnectError(
      "No Stripe connected account is attached to this merchant.",
      409,
      "connected_account_missing",
    );
  }
  return getStripe().accounts.createLoginLink(normalizedAccountId);
}

async function stripeAccountsV2Request<T>(
  url: string,
  input: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  },
): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    throw new StripeMarketplaceConnectError(
      "Stripe Connect is not configured on the server.",
      503,
      "stripe_not_configured",
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: input.method,
      headers: {
        Authorization: `Bearer ${secret}`,
        "Stripe-Version": STRIPE_ACCOUNTS_V2_VERSION,
        ...(input.body ? { "Content-Type": "application/json" } : {}),
        ...(input.idempotencyKey
          ? { "Idempotency-Key": input.idempotencyKey }
          : {}),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    throw new StripeMarketplaceConnectError(
      error instanceof Error
        ? `Stripe Connect could not be reached: ${error.message}`
        : "Stripe Connect could not be reached.",
      502,
      "stripe_network_error",
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | T
    | {
        error?: {
          code?: string;
          message?: string;
        };
      }
    | null;

  if (!response.ok) {
    const candidate = payload as
      | { error?: { code?: string; message?: string } }
      | null;
    const code = clean(candidate?.error?.code, 120) || null;
    const stripeMessage = clean(candidate?.error?.message, 500);
    throw new StripeMarketplaceConnectError(
      marketplaceConnectErrorMessage(code, stripeMessage),
      response.status,
      code,
    );
  }

  if (!payload) {
    throw new StripeMarketplaceConnectError(
      "Stripe returned an empty marketplace account response.",
      502,
      "empty_stripe_response",
    );
  }

  return payload as T;
}

function marketplaceConnectErrorMessage(
  code: string | null,
  stripeMessage: string,
) {
  if (
    code === "account_creation_liability_unacknowledged" ||
    code === "account_creation_requirement_collection_and_liability_unacknowledged"
  ) {
    return "VI Guide must acknowledge its Stripe Connect marketplace liability in Stripe before merchant payout accounts can be created.";
  }
  if (code === "connect_profile_not_submitted") {
    return "VI Guide must finish its Stripe Connect platform profile before merchant payout accounts can be created.";
  }
  if (
    code === "accounts_v2_access_blocked" ||
    code === "non_connect_platform_accounts_v2_access_blocked"
  ) {
    return "Stripe Accounts v2 is not enabled for this VI Guide account yet.";
  }
  if (code === "connect_identity_not_verified") {
    return "VI Guide must complete Stripe platform identity verification before merchant payout accounts can be created.";
  }
  return stripeMessage || "Stripe could not complete the marketplace account request.";
}

function normalizeHttpsOrigin(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function normalizeEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
