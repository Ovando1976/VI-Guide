import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import places from "../data/travel-knowledge/places.json";
import beaches from "../data/travel-knowledge/beaches.json";
import historicSites from "../data/travel-knowledge/historic-sites.json";
import { ACCOMMODATIONS } from "../lib/accommodations";

type IslandCode = "stt" | "stj" | "stx";
type Candidate = {
  id: string;
  slug: string;
  name: string;
  island: IslandCode;
  category: string;
  location?: string;
  address?: string;
  source: "places" | "beaches" | "historic" | "accommodations";
  lat?: number;
  lng?: number;
};
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
};
type RegistryRecord = {
  lat: number;
  lng: number;
  provider: "google-places";
  placeId?: string;
  formattedAddress?: string;
  matchedName?: string;
  confidence: number;
  resolvedAt: string;
};
type QuarantineRecord = Candidate & {
  reason: string;
  bestMatch?: GooglePlace;
  confidence?: number;
  searchedAt: string;
};

async function main() {
  const root = process.cwd();

  dotenv.config({ path: path.join(root, ".env.local") });
  dotenv.config({ path: path.join(root, ".env") });

  const apply = process.argv.includes("--apply");
  const retryAll = process.argv.includes("--retry-all");
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();

  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY is required in .env.local or .env");
  }

  const registryPath = path.join(root, "data/territory-coordinates.json");
  const quarantinePath = path.join(
    root,
    "data/territory-coordinate-quarantine.json"
  );

  const registry = readJson<Record<string, RegistryRecord>>(registryPath, {});

  const previousQuarantine = readJson<QuarantineRecord[]>(quarantinePath, []);

  const previousQuarantineKeys = new Set(
    previousQuarantine.map((item) => identity(item))
  );

  const candidates = dedupe([
    ...places.map(
      (item): Candidate => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        island: parseIslandCode(item.island),
        category: item.category,
        source: "places",
      })
    ),

    ...beaches.map(
      (item): Candidate => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        island: parseIslandCode(item.island),
        category: item.category,
        source: "beaches",
      })
    ),

    ...historicSites.map(
      (item): Candidate => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        island: parseIslandCode(item.island),
        category: item.category,
        source: "historic",
      })
    ),

    ...ACCOMMODATIONS.map(
      (item): Candidate => ({
        id: item.id,
        slug: item.slug ?? item.id,
        name: item.name,
        island: parseIslandCode(item.island),
        category: item.category,
        location: item.location,
        address: item.address,
        source: "accommodations",
        lat: item.lat,
        lng: item.lng,
      })
    ),
  ]);

  const unresolved = candidates.filter((item) => {
    if (typeof item.lat === "number" && typeof item.lng === "number") {
      return false;
    }

    if (registry[identity(item)]) {
      return false;
    }

    if (!retryAll && previousQuarantineKeys.has(identity(item))) {
      return false;
    }

    return true;
  });

  console.log(`Coordinate audit: ${candidates.length} unique entities`);
  console.log(`Already positioned: ${candidates.length - unresolved.length}`);
  console.log(`To resolve: ${unresolved.length}`);
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN");

  const quarantine: QuarantineRecord[] = retryAll
    ? []
    : [...previousQuarantine];

  let resolved = 0;

  for (let index = 0; index < unresolved.length; index += 1) {
    const item = unresolved[index];

    const prefix =
      `[${index + 1}/${unresolved.length}] ` +
      `${item.name} (${item.island.toUpperCase()})`;

    try {
      const matches = await searchGooglePlaces(item, key);

      const ranked = matches
        .map((place) => ({
          place,
          confidence: scoreMatch(item, place),
        }))
        .filter(({ place }) => isInsideIsland(item.island, place.location))
        .sort((a, b) => b.confidence - a.confidence);

      const best = ranked[0];
      const runnerUp = ranked[1];

      const clearWinner =
        Boolean(best) &&
        (!runnerUp || best.confidence - runnerUp.confidence >= 0.08);

      if (!best?.place.location || best.confidence < 0.78 || !clearWinner) {
        quarantine.push({
          ...item,
          reason: !best
            ? "No candidate inside the expected island bounds"
            : best.confidence < 0.78
            ? "Best candidate did not meet the confidence threshold"
            : "Top candidates were too similar; manual review required",
          bestMatch: best?.place,
          confidence: best?.confidence,
          searchedAt: new Date().toISOString(),
        });

        console.log(
          `${prefix} -> QUARANTINE${
            best ? ` (${best.confidence.toFixed(2)})` : ""
          }`
        );

        continue;
      }

      const latitude = best.place.location.latitude;
      const longitude = best.place.location.longitude;

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new Error("Google candidate did not contain valid coordinates");
      }

      const record: RegistryRecord = {
        lat: latitude,
        lng: longitude,
        provider: "google-places",
        placeId: best.place.id,
        formattedAddress: best.place.formattedAddress,
        matchedName: best.place.displayName?.text,
        confidence: Number(best.confidence.toFixed(3)),
        resolvedAt: new Date().toISOString(),
      };

      registry[identity(item)] = record;
      removeQuarantine(quarantine, item);
      resolved += 1;

      console.log(
        `${prefix} -> ${record.matchedName ?? item.name} ` +
          `(${record.confidence.toFixed(2)})`
      );
    } catch (error) {
      quarantine.push({
        ...item,
        reason:
          error instanceof Error ? error.message : "Unknown resolver error",
        searchedAt: new Date().toISOString(),
      });

      console.error(
        `${prefix} -> ERROR: ${
          error instanceof Error ? error.message : "Unknown resolver error"
        }`
      );
    }

    await sleep(120);
  }

  const sortedRegistry = Object.fromEntries(
    Object.entries(registry).sort(([a], [b]) => a.localeCompare(b))
  );

  const uniqueQuarantine = dedupeQuarantine(quarantine).sort((a, b) =>
    identity(a).localeCompare(identity(b))
  );

  if (apply) {
    fs.writeFileSync(
      registryPath,
      `${JSON.stringify(sortedRegistry, null, 2)}\n`
    );

    fs.writeFileSync(
      quarantinePath,
      `${JSON.stringify(uniqueQuarantine, null, 2)}\n`
    );
  }

  console.log("\nCoordinate resolution summary");
  console.log(`Resolved this run: ${resolved}`);
  console.log(`Registry total: ${Object.keys(sortedRegistry).length}`);
  console.log(`Quarantined: ${uniqueQuarantine.length}`);

  if (!apply) {
    console.log(
      "No files changed. Re-run with --apply to write verified coordinates."
    );
  }
}
main().catch((error: unknown) => {
  console.error("\nCoordinate resolver failed.");

  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});

async function searchGooglePlaces(
  item: Candidate,
  apiKey: string
): Promise<GooglePlace[]> {
  const query = [
    item.name,
    item.address || item.location,
    islandLabel(item.island),
    "U.S. Virgin Islands",
  ]
    .filter(Boolean)
    .join(", ");
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types",
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 5,
        locationBias: { rectangle: ISLAND_BOUNDS[item.island] },
      }),
    }
  );
  const payload = (await response.json().catch(() => ({}))) as {
    places?: GooglePlace[];
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(
      payload.error?.message || `Google Places returned ${response.status}`
    );
  return payload.places ?? [];
}

function parseIslandCode(value: string): IslandCode {
  const normalized = normalize(value);

  if (
    normalized === "stt" ||
    normalized === "st-thomas" ||
    normalized === "saint-thomas"
  ) {
    return "stt";
  }

  if (
    normalized === "stj" ||
    normalized === "st-john" ||
    normalized === "saint-john"
  ) {
    return "stj";
  }

  if (
    normalized === "stx" ||
    normalized === "st-croix" ||
    normalized === "saint-croix"
  ) {
    return "stx";
  }

  throw new Error(`Unsupported island value: "${value}"`);
}

function scoreMatch(item: Candidate, place: GooglePlace) {
  const expected = tokens(item.name);
  const actual = tokens(place.displayName?.text ?? "");
  const overlap = expected.length
    ? expected.filter((token) => actual.includes(token)).length /
      expected.length
    : 0;
  const reverse = actual.length
    ? actual.filter((token) => expected.includes(token)).length / actual.length
    : 0;
  const address = (place.formattedAddress ?? "").toLowerCase();
  const islandScore = islandAliases(item.island).some((alias) =>
    address.includes(alias)
  )
    ? 0.18
    : 0;
  const locationTokens = tokens(item.address || item.location || "");
  const locationScore = locationTokens.length
    ? (locationTokens.filter((token) => address.includes(token)).length /
        locationTokens.length) *
      0.12
    : 0;
  const categoryScore = categoryCompatible(item.category, place.types ?? [])
    ? 0.06
    : 0;
  return Math.min(
    1,
    overlap * 0.48 +
      reverse * 0.16 +
      islandScore +
      locationScore +
      categoryScore
  );
}

function categoryCompatible(category: string, types: string[]) {
  const value = category.toLowerCase();
  if (value.includes("beach"))
    return types.some(
      (type) => type.includes("beach") || type === "tourist_attraction"
    );
  if (/hotel|resort|villa|guesthouse|apartment/.test(value))
    return types.some((type) => /lodging|hotel|resort/.test(type));
  if (/historic|landmark|ruins|fort|museum/.test(value))
    return types.some((type) =>
      /museum|historical|tourist_attraction|landmark/.test(type)
    );
  if (/restaurant|bar|cafe/.test(value))
    return types.some((type) => /restaurant|bar|cafe/.test(type));
  return true;
}

function identity(item: Pick<Candidate, "island" | "slug" | "id">) {
  return `${item.island}:${normalize(item.slug || item.id)}`;
}
function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function tokens(value: string) {
  const ignored = new Set([
    "and",
    "the",
    "at",
    "of",
    "by",
    "saint",
    "st",
    "usvi",
    "virgin",
    "islands",
  ]);
  return normalize(value)
    .split("-")
    .filter((token) => token.length > 1 && !ignored.has(token));
}
function islandLabel(island: IslandCode) {
  return island === "stt"
    ? "St. Thomas"
    : island === "stj"
    ? "St. John"
    : "St. Croix";
}
function islandAliases(island: IslandCode) {
  return island === "stt"
    ? ["st thomas", "saint thomas"]
    : island === "stj"
    ? ["st john", "saint john"]
    : ["st croix", "saint croix"];
}
function isInsideIsland(
  island: IslandCode,
  location?: GooglePlace["location"]
) {
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  )
    return false;
  const bounds = ISLAND_BOUNDS[island];
  return (
    location.latitude >= bounds.low.latitude &&
    location.latitude <= bounds.high.latitude &&
    location.longitude >= bounds.low.longitude &&
    location.longitude <= bounds.high.longitude
  );
}
function dedupe(items: Candidate[]) {
  return [...new Map(items.map((item) => [identity(item), item])).values()];
}
function dedupeQuarantine(items: QuarantineRecord[]) {
  return [...new Map(items.map((item) => [identity(item), item])).values()];
}
function removeQuarantine(items: QuarantineRecord[], candidate: Candidate) {
  const key = identity(candidate);
  for (let index = items.length - 1; index >= 0; index -= 1)
    if (identity(items[index]) === key) items.splice(index, 1);
}
function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ISLAND_BOUNDS: Record<
  IslandCode,
  {
    low: { latitude: number; longitude: number };
    high: { latitude: number; longitude: number };
  }
> = {
  stt: {
    low: { latitude: 18.275, longitude: -65.05 },
    high: { latitude: 18.43, longitude: -64.78 },
  },
  stj: {
    low: { latitude: 18.27, longitude: -64.86 },
    high: { latitude: 18.4, longitude: -64.65 },
  },
  stx: {
    low: { latitude: 17.62, longitude: -65.02 },
    high: { latitude: 17.86, longitude: -64.52 },
  },
};
