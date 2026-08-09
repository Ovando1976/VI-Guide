import type {
  CommerceCancellationPolicy,
  CommerceCancellationPolicyCode,
} from "@/types/commerce-booking";

type PolicyDefinition = Omit<CommerceCancellationPolicy, "verifiedAt">;

const POLICIES: Record<CommerceCancellationPolicyCode, PolicyDefinition> = {
  flexible: {
    code: "flexible",
    title: "Flexible cancellation",
    travelerTerms:
      "Cancel at least 24 hours before the scheduled start for a full refund of amounts paid. Later requests require provider and VI Guide review.",
    providerTerms:
      "If the provider cancels, amounts paid for the cancelled service are eligible for a full refund.",
    changeTerms:
      "Date or time changes may be requested before the scheduled start and depend on availability.",
    fullRefundCutoffHours: 24,
    partialRefundCutoffHours: null,
    partialRefundPercent: null,
  },
  standard: {
    code: "standard",
    title: "Standard cancellation",
    travelerTerms:
      "Cancel at least 48 hours before the scheduled start for a full refund. Cancellations 24–48 hours before start are eligible for a 50% refund. Later requests require review.",
    providerTerms:
      "If the provider cancels, amounts paid for the cancelled service are eligible for a full refund.",
    changeTerms:
      "Date or time changes requested at least 24 hours before start depend on availability.",
    fullRefundCutoffHours: 48,
    partialRefundCutoffHours: 24,
    partialRefundPercent: 50,
  },
  strict: {
    code: "strict",
    title: "Strict cancellation",
    travelerTerms:
      "Cancel at least 7 days before the scheduled start for a full refund. Cancellations 48 hours–7 days before start are eligible for a 50% refund. Later requests require review.",
    providerTerms:
      "If the provider cancels, amounts paid for the cancelled service are eligible for a full refund.",
    changeTerms:
      "Date or time changes requested at least 48 hours before start depend on availability.",
    fullRefundCutoffHours: 168,
    partialRefundCutoffHours: 48,
    partialRefundPercent: 50,
  },
};

export function resolveCancellationPolicy(
  value: unknown,
  verifiedAt = new Date().toISOString(),
): CommerceCancellationPolicy | null {
  const code =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String((value as { code?: unknown }).code ?? "")
        : "";
  if (!(code in POLICIES)) return null;
  return { ...POLICIES[code as CommerceCancellationPolicyCode], verifiedAt };
}

export function normalizeCancellationPolicy(
  value: unknown,
): CommerceCancellationPolicy | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CommerceCancellationPolicy>;
  const policy = resolveCancellationPolicy(candidate.code, cleanTimestamp(candidate.verifiedAt));
  return policy;
}

export function cancellationRefundEstimate(params: {
  policy: CommerceCancellationPolicy;
  startDate: string;
  preferredTime?: string | null;
  paidAmountCents: number;
  now?: Date;
}) {
  const paid = Math.max(0, Math.round(params.paidAmountCents));
  if (!paid) return { amountCents: 0, disposition: "no_payment" as const };
  const start = bookingStart(params.startDate, params.preferredTime);
  if (!start) return { amountCents: 0, disposition: "review_required" as const };
  const hours = (start.getTime() - (params.now ?? new Date()).getTime()) / 3_600_000;
  if (hours >= params.policy.fullRefundCutoffHours) {
    return { amountCents: paid, disposition: "full" as const };
  }
  if (
    params.policy.partialRefundCutoffHours !== null &&
    params.policy.partialRefundPercent !== null &&
    hours >= params.policy.partialRefundCutoffHours
  ) {
    return {
      amountCents: Math.round((paid * params.policy.partialRefundPercent) / 100),
      disposition: "partial" as const,
    };
  }
  return { amountCents: 0, disposition: "review_required" as const };
}

function bookingStart(startDate: string, preferredTime?: string | null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
  const time = /^\d{2}:\d{2}$/.test(preferredTime ?? "")
    ? preferredTime
    : "12:00";
  const value = new Date(`${startDate}T${time}:00-04:00`);
  return Number.isFinite(value.getTime()) ? value : null;
}

function cleanTimestamp(value: unknown) {
  if (typeof value !== "string") return new Date(0).toISOString();
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date(0).toISOString();
}
