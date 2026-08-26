import type { PartnerApplicationStatus } from "@/lib/partners/partner-application";

export type PublicPartnerApplicationStatus = {
  status: PartnerApplicationStatus;
  label: string;
  message: string;
  action: string | null;
};

export function normalizePartnerApplicationReference(value: unknown) {
  const reference = clean(value, 40).toUpperCase();
  return /^VI-(?:PARTNER|CLAIM)-\d{8}-[A-F0-9]{6}$/.test(reference)
    ? reference
    : "";
}

export function partnerStatusCollectionForReference(reference: string) {
  return reference.startsWith("VI-CLAIM-")
    ? "businessClaims"
    : "partnerApplications";
}

export function normalizePartnerStatusEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) ? email : "";
}

export function publicPartnerApplicationStatus(
  value: PartnerApplicationStatus,
): PublicPartnerApplicationStatus {
  if (value === "new") {
    return {
      status: value,
      label: "Application received",
      message:
        "USVI Explorer received the request and it is waiting for an initial business review.",
      action: "No action is required right now.",
    };
  }
  if (value === "reviewing") {
    return {
      status: value,
      label: "Under review",
      message:
        "The USVI Explorer team is verifying the business information and matching the correct island listing.",
      action: "Keep an eye on the contact email for any verification questions.",
    };
  }
  if (value === "needs_information") {
    return {
      status: value,
      label: "More information needed",
      message:
        "The review needs additional business or listing information before it can continue.",
      action: "Check the contact email and respond to the USVI Explorer team.",
    };
  }
  if (value === "approved") {
    return {
      status: value,
      label: "Approved",
      message:
        "The business request was approved. Merchant access still requires a verified USVI Explorer account and listing assignment.",
      action: "Follow the onboarding instructions sent by the USVI Explorer team.",
    };
  }
  return {
    status: "declined",
    label: "Not approved",
    message:
      "The current request was not approved for USVI Explorer merchant access.",
    action:
      "Contact the USVI Explorer team before submitting new information or another request.",
  };
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
