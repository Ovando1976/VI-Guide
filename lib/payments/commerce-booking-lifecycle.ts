export type CommerceLifecycleStatus =
  | "draft"
  | "requested"
  | "reviewing"
  | "payment_required"
  | "paid"
  | "confirmed"
  | "completed"
  | "declined"
  | "cancelled";

export type MerchantCommerceTransition = Exclude<
  CommerceLifecycleStatus,
  "draft" | "requested" | "paid"
>;

const MERCHANT_TRANSITIONS: Record<
  CommerceLifecycleStatus,
  MerchantCommerceTransition[]
> = {
  draft: [],
  requested: ["reviewing", "payment_required", "declined", "cancelled"],
  reviewing: ["payment_required", "declined", "cancelled"],
  payment_required: ["declined", "cancelled"],
  paid: ["confirmed"],
  confirmed: ["completed"],
  completed: [],
  declined: [],
  cancelled: [],
};

export function normalizeCommerceLifecycleStatus(
  value: unknown,
): CommerceLifecycleStatus {
  return typeof value === "string" && value in MERCHANT_TRANSITIONS
    ? (value as CommerceLifecycleStatus)
    : "requested";
}

export function merchantCommerceTransitionsForStatus(
  value: unknown,
): MerchantCommerceTransition[] {
  const status = normalizeCommerceLifecycleStatus(value);
  return [...MERCHANT_TRANSITIONS[status]];
}

export function canMerchantCommerceTransition(
  currentStatus: unknown,
  nextStatus: unknown,
): nextStatus is MerchantCommerceTransition {
  return (
    isMerchantCommerceTransition(nextStatus) &&
    merchantCommerceTransitionsForStatus(currentStatus).includes(nextStatus)
  );
}

export function merchantCommerceTransitionError(input: {
  currentStatus: CommerceLifecycleStatus;
  nextStatus: MerchantCommerceTransition;
  depositAmountCents: number;
  hasActiveCheckout?: boolean;
}) {
  if (!canMerchantCommerceTransition(input.currentStatus, input.nextStatus)) {
    if (input.currentStatus === "paid" && input.nextStatus === "cancelled") {
      return "Paid bookings must use the refund workflow before cancellation.";
    }
    if (input.nextStatus === "confirmed" && input.currentStatus !== "paid") {
      return "Only a Stripe-verified paid booking can be confirmed.";
    }
    if (input.nextStatus === "completed" && input.currentStatus !== "confirmed") {
      return "Only a confirmed booking can be completed.";
    }
    return `A ${input.currentStatus.replaceAll("_", " ")} booking cannot move to ${input.nextStatus.replaceAll("_", " ")}.`;
  }

  if (
    input.nextStatus === "payment_required" &&
    (!Number.isSafeInteger(input.depositAmountCents) ||
      input.depositAmountCents <= 0)
  ) {
    return "Enter a valid deposit amount before requesting payment.";
  }

  if (
    input.currentStatus === "payment_required" &&
    input.hasActiveCheckout &&
    (input.nextStatus === "declined" || input.nextStatus === "cancelled")
  ) {
    return "Expire the active Stripe Checkout Session before closing this booking.";
  }

  return null;
}

export function isMerchantCommerceTransition(
  value: unknown,
): value is MerchantCommerceTransition {
  return (
    value === "reviewing" ||
    value === "payment_required" ||
    value === "confirmed" ||
    value === "completed" ||
    value === "declined" ||
    value === "cancelled"
  );
}
