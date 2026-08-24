export type DriverApplicationStatus =
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected";

export type DriverApplicationInput = {
  displayName: string;
  phone: string;
  island: "stt" | "stj" | "stx";
  taxiCommissionBadgeNumber: string;
  taxiCommissionBadgeExpiresAt: string;
  licenseClass: string;
  licenseExpiresAt: string;
  taxiPlate: string;
  vehicleDescription: string;
  associationName: string;
  consent: boolean;
};

export type DriverApplicationNormalization =
  | { ok: true; application: DriverApplicationInput }
  | { ok: false; error: string };

const ISLANDS = new Set(["stt", "stj", "stx"]);

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isFutureDate(value: string, now: Date) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

export function normalizeDriverApplication(
  value: unknown,
  now = new Date(),
): DriverApplicationNormalization {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const displayName = text(input.displayName, 100);
  const phone = text(input.phone, 40);
  const island = text(input.island, 20);
  const taxiCommissionBadgeNumber = text(input.taxiCommissionBadgeNumber, 80);
  const taxiCommissionBadgeExpiresAt = text(
    input.taxiCommissionBadgeExpiresAt,
    32,
  );
  const licenseClass = text(input.licenseClass, 40);
  const licenseExpiresAt = text(input.licenseExpiresAt, 32);
  const taxiPlate = text(input.taxiPlate, 40);
  const vehicleDescription = text(input.vehicleDescription, 160);
  const associationName = text(input.associationName, 120);

  if (!displayName || !phone) {
    return { ok: false, error: "Enter your legal name and phone number." };
  }
  if (!ISLANDS.has(island)) {
    return { ok: false, error: "Choose St. Thomas, St. John, or St. Croix." };
  }
  if (!taxiCommissionBadgeNumber) {
    return {
      ok: false,
      error: "Enter your Taxicab Commission badge or permit number.",
    };
  }
  if (!isFutureDate(taxiCommissionBadgeExpiresAt, now)) {
    return {
      ok: false,
      error: "Enter a future Taxicab Commission badge expiration date.",
    };
  }
  if (!licenseClass || !isFutureDate(licenseExpiresAt, now)) {
    return {
      ok: false,
      error: "Enter a valid driver license class and future expiration date.",
    };
  }
  if (!taxiPlate || vehicleDescription.length < 6) {
    return {
      ok: false,
      error: "Enter the taxi plate and a short vehicle description.",
    };
  }
  if (!associationName) {
    return {
      ok: false,
      error: "Enter the taxi association or operating company.",
    };
  }
  if (input.consent !== true) {
    return {
      ok: false,
      error: "Accept the driver application and economics disclosure.",
    };
  }

  return {
    ok: true,
    application: {
      displayName,
      phone,
      island: island as DriverApplicationInput["island"],
      taxiCommissionBadgeNumber,
      taxiCommissionBadgeExpiresAt,
      licenseClass,
      licenseExpiresAt,
      taxiPlate,
      vehicleDescription,
      associationName,
      consent: true,
    },
  };
}
