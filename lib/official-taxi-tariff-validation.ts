import type { OfficialTaxiTariff } from "@/types/taxi-operations";

export function getOfficialTaxiTariffValidationErrors(tariff: OfficialTaxiTariff) {
  const errors: string[] = [];
  if (tariff.issuingAuthority !== "Virgin Islands Taxicab Commission") errors.push("Tariff is not attributed to the Virgin Islands Taxicab Commission.");
  if (!tariff.sourceUrl || !/^https:\/\//i.test(tariff.sourceUrl)) errors.push("Tariff does not include a verifiable HTTPS source URL.");
  if (tariff.status === "active" && (!tariff.approvedAt || !Number.isFinite(Date.parse(tariff.approvedAt)) || !tariff.approvedBy)) {
    errors.push("Active tariff is missing Commission verification approval metadata.");
  }
  if (tariff.status === "active" && !(tariff.sources ?? []).some((source) => source.sourceType === "commission_schedule")) {
    errors.push("Active tariff must include the verified Commission schedule as a source document.");
  }
  if (!tariff.version || !tariff.effectiveAt || !Number.isFinite(Date.parse(tariff.effectiveAt))) errors.push("Tariff is missing valid version or effective-date metadata.");
  else if (Date.parse(tariff.effectiveAt) > Date.now()) errors.push("Tariff is not effective yet.");
  if (!Array.isArray(tariff.rules) || tariff.rules.length === 0) errors.push("Tariff contains no published route rules.");

  const ids = new Set<string>();
  for (const rule of tariff.rules ?? []) {
    if (!rule.id || ids.has(rule.id)) errors.push("Tariff contains a missing or duplicate rule identifier.");
    ids.add(rule.id);
    if (!Number.isFinite(rule.onePassengerFare) || rule.onePassengerFare < 0) errors.push(`Rule ${rule.id} contains an invalid fare.`);
    if (!(rule.originEstateGeoids?.length || rule.originNames?.length) || !(rule.destinationEstateGeoids?.length || rule.destinationNames?.length)) {
      errors.push(`Rule ${rule.id} is missing an origin or destination identifier.`);
    }
    const normalizedOrigins = new Set((rule.originNames ?? []).map(normalizeEndpoint));
    const normalizedDestinations = new Set((rule.destinationNames ?? []).map(normalizeEndpoint));
    if (normalizedOrigins.has("") || normalizedDestinations.has("")) errors.push(`Rule ${rule.id} contains an empty endpoint alias.`);
    for (const band of rule.passengerFareBands ?? []) {
      if (!Number.isInteger(band.minimumPassengers) || band.minimumPassengers < 1 ||
          (band.maximumPassengers !== undefined && (!Number.isInteger(band.maximumPassengers) || band.maximumPassengers < band.minimumPassengers)) ||
          !Number.isFinite(band.amount) || band.amount < 0) errors.push(`Rule ${rule.id} contains an invalid passenger fare band.`);
    }
    if (rule.passengerFareBands?.length) {
      for (let party = 1; party <= 12; party += 1) {
        const matches = rule.passengerFareBands.filter((band) => party >= band.minimumPassengers && (band.maximumPassengers === undefined || party <= band.maximumPassengers));
        if (matches.length !== 1) errors.push(`Rule ${rule.id} must define exactly one fare band for ${party} passengers.`);
      }
    }
  }
  return [...new Set(errors)];
}

function normalizeEndpoint(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}
