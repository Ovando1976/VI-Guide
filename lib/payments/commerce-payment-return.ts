export type CommercePaymentReturnOutcome = "success" | "cancelled";

export type CommercePaymentReturn = {
  outcome: CommercePaymentReturnOutcome;
  reference: string;
};

const COMMERCE_REFERENCE_PATTERN = /^VI-(?:STAY|TOUR|EXP)-[A-Z0-9-]{6,64}$/;

export function parseCommercePaymentReturn(
  payment: string | null,
  reference: string | null,
): CommercePaymentReturn | null {
  const outcome = normalizeOutcome(payment);
  const normalizedReference = normalizeReference(reference);

  if (!outcome || !COMMERCE_REFERENCE_PATTERN.test(normalizedReference)) {
    return null;
  }

  return {
    outcome,
    reference: normalizedReference,
  };
}

function normalizeOutcome(value: string | null) {
  return value === "success" || value === "cancelled" ? value : null;
}

function normalizeReference(value: string | null) {
  return typeof value === "string"
    ? value.replace(/\s+/g, "").trim().toUpperCase().slice(0, 80)
    : "";
}
