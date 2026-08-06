import type { PartnerApplicationStatus } from "@/lib/partners/partner-application";

export type PublicPartnerApplicationStatus = {
  status: PartnerApplicationStatus;
  label: string;
  message: string;
  action: string | null;
};

export function normalizePartnerApplicationReference(value: unknown) {
  const reference = clean(value, 40).toUpperCase();
  return /^VI-PARTNER-\d{8}-[A-F0-9]{6}$/.test(reference)
    ? reference
    : "";
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
        "VI Guide received the application and it is waiting for an initial business review.",
      action: "No action is required right now.",
    };
  }
  if (value === "reviewing") {
    return {
      status: value,
      label: "Under review",
      message:
        "The VI Guide team is verifying the business information and matching the correct island listing.",
      action: "Keep an eye on the contact email for any verification questions.",
    };
  }
  if (value === "needs_information") {
    return {
      status: value,
      label: "More information needed",
      message:
        "The review needs additional business or listing information before it can continue.",
      action: "Check the contact email and respond to the VI Guide team.",
    };
  }
  if (value === "approved") {
    return {
      status: value,
      label: "Approved",
      message:
        "The business application was approved. Merchant access still requires a verified VI Guide account and listing assignment.",
      action: "Follow the onboarding instructions sent by the VI Guide team.",
    };
  }
  return {
    status: "declined",
    label: "Not approved",
    message:
      "The current application was not approved for VI Guide merchant access.",
    action:
      "Contact the VI Guide team before submitting new information or another application.",
  };
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
