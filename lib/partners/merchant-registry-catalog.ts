import { ACCOMMODATIONS } from "@/lib/accommodations";
import { BOOKABLE_EXPERIENCES } from "@/lib/bookable-experiences";
import { CAR_RENTAL_OPERATORS } from "@/lib/car-rentals";
import { RESTAURANTS } from "@/lib/restaurant-directory";
import {
  merchantRegistryCanonicalKey,
  merchantRegistryDocumentId,
  type MerchantAcquisitionStage,
} from "@/lib/partners/merchant-registry";

export type MerchantRegistrySourceKind =
  | "accommodation"
  | "restaurant"
  | "experience_operator"
  | "car_rental";

export type MerchantRegistryCatalogCandidate = {
  id: string;
  canonicalKey: string;
  businessName: string;
  island: string;
  category: string;
  sourceKinds: MerchantRegistrySourceKind[];
  sourceRecordIds: string[];
  sourceUrls: string[];
  website: string | null;
  phone: string | null;
  location: string | null;
  seedStage: MerchantAcquisitionStage;
};

type CandidateSeed = Omit<
  MerchantRegistryCatalogCandidate,
  "id" | "canonicalKey" | "sourceKinds" | "sourceRecordIds" | "sourceUrls" | "seedStage"
> & {
  sourceKind: MerchantRegistrySourceKind;
  sourceRecordId: string;
  sourceUrls?: Array<string | null | undefined>;
};

export function buildMerchantRegistryCatalog(): MerchantRegistryCatalogCandidate[] {
  const seeds: CandidateSeed[] = [];

  for (const item of ACCOMMODATIONS) {
    seeds.push({
      businessName: item.name,
      island: item.island,
      category: "Accommodation",
      sourceKind: "accommodation",
      sourceRecordId: item.id,
      sourceUrls: [item.sourceUrl, item.website],
      website: item.website ?? null,
      phone: item.phone ?? null,
      location: item.address ?? item.location ?? null,
    });
  }

  for (const item of RESTAURANTS) {
    seeds.push({
      businessName: item.name,
      island: item.island,
      category: "Restaurant",
      sourceKind: "restaurant",
      sourceRecordId: item.id,
      sourceUrls: [item.sourceUrl, item.website],
      website: item.website ?? null,
      phone: item.phone ?? null,
      location: item.address ?? null,
    });
  }

  for (const experience of BOOKABLE_EXPERIENCES) {
    seeds.push({
      businessName: experience.operator,
      island: experience.island,
      category: "Experience operator",
      sourceKind: "experience_operator",
      sourceRecordId: experience.id,
      sourceUrls: [experience.sourceUrl],
      website: experience.sourceUrl || null,
      phone: null,
      location: experience.location || null,
    });
  }

  for (const operator of CAR_RENTAL_OPERATORS) {
    seeds.push({
      businessName: operator.name,
      island: operator.island,
      category: "Car rental",
      sourceKind: "car_rental",
      sourceRecordId: operator.id,
      sourceUrls: [operator.website],
      website: operator.website ?? null,
      phone: operator.phone ?? null,
      location: operator.location ?? null,
    });
  }

  const candidates = new Map<string, MerchantRegistryCatalogCandidate>();
  for (const seed of seeds) {
    const canonicalKey = merchantRegistryCanonicalKey(seed.island, seed.businessName);
    const id = merchantRegistryDocumentId(seed.island, seed.businessName);
    if (!canonicalKey || !id) continue;

    const sourceUrls = uniqueStrings(seed.sourceUrls ?? []);
    const existing = candidates.get(canonicalKey);
    if (!existing) {
      candidates.set(canonicalKey, {
        id,
        canonicalKey,
        businessName: seed.businessName.trim(),
        island: seed.island,
        category: seed.category,
        sourceKinds: [seed.sourceKind],
        sourceRecordIds: [seed.sourceRecordId],
        sourceUrls,
        website: seed.website,
        phone: seed.phone,
        location: seed.location,
        seedStage: "profile_created",
      });
      continue;
    }

    existing.sourceKinds = uniqueStrings([
      ...existing.sourceKinds,
      seed.sourceKind,
    ]) as MerchantRegistrySourceKind[];
    existing.sourceRecordIds = uniqueStrings([
      ...existing.sourceRecordIds,
      seed.sourceRecordId,
    ]);
    existing.sourceUrls = uniqueStrings([...existing.sourceUrls, ...sourceUrls]);
    existing.website ||= seed.website;
    existing.phone ||= seed.phone;
    existing.location ||= seed.location;
    if (!existing.category.includes(seed.category)) {
      existing.category = `${existing.category} · ${seed.category}`;
    }
  }

  return [...candidates.values()].sort(
    (a, b) =>
      a.island.localeCompare(b.island) || a.businessName.localeCompare(b.businessName),
  );
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}
