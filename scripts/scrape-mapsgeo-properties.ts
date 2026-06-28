// scripts/scrape-mapsgeo-properties.ts

import fs from "node:fs";
import path from "node:path";
import { chromium, type Page, type Request, type Response } from "playwright";

const MAPGEO_HOST = "https://usvi.mapgeo.io";
const START_URL = `${MAPGEO_HOST}/datasets/properties`;

const INPUT_PARCELS = path.resolve("public/data/usvi-parcels-addressed.geojson");

const OUTPUT_DIR = path.resolve("generated/mapgeo");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "mapgeo-properties.json");
const ENDPOINTS_FILE = path.join(OUTPUT_DIR, "mapgeo-network-hits.json");
const REQUESTS_FILE = path.join(OUTPUT_DIR, "mapgeo-search-requests.json");
const DEBUG_HTML_FILE = path.join(OUTPUT_DIR, "last-page.html");
const DEBUG_SCREENSHOT_FILE = path.join(OUTPUT_DIR, "last-page.png");

const LIMIT = Number(process.env.MAPGEO_LIMIT ?? process.env.MAPSGEO_LIMIT ?? 25);
const HEADLESS =
  (process.env.MAPGEO_HEADLESS ?? process.env.MAPSGEO_HEADLESS) !== "false";
const DELAY_MS = Number(
  process.env.MAPGEO_DELAY_MS ?? process.env.MAPSGEO_DELAY_MS ?? 1800
);
const TIMEOUT_MS = Number(
  process.env.MAPGEO_TIMEOUT_MS ?? process.env.MAPSGEO_TIMEOUT_MS ?? 60000
);

type JsonObject = Record<string, unknown>;

type ParcelFeature = {
  properties?: JsonObject;
};

type ParcelGeoJson = {
  features?: ParcelFeature[];
};

type PropertyRecord = {
  propertyId?: string;
  parcelId?: string;
  address?: string;
  island?: string;
  estate?: string;
  owner?: string;
  ownerAddress?: string;
  zoning?: string;
  acres?: string;
  sourceUrl?: string;
  raw?: unknown;
};

type NetworkHit = {
  url: string;
  status: number;
  contentType?: string;
  sample: string;
};

type SearchRequestHit = {
  url: string;
  method: string;
  postData: string | null;
  headers: Record<string, string>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length ? text : undefined;
}

function ensureDir(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function loadParcelIds(): string[] {
  const raw = fs.readFileSync(INPUT_PARCELS, "utf8");
  const geojson = JSON.parse(raw) as ParcelGeoJson;

  const ids = new Set<string>();

  for (const feature of geojson.features ?? []) {
    const props = feature.properties ?? {};

    const id =
      clean(props.propertyId) ??
      clean(props.PropertyID) ??
      clean(props.PROPERTYID) ??
      clean(props.parcelId) ??
      clean(props.sourceParcelNo) ??
      clean(props.PARCELID) ??
      clean(props.PARCEL_ID);

    if (id) ids.add(id);
  }

  return [...ids].slice(0, LIMIT);
}

function deepFindValue(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;

  const record = obj as JsonObject;

  for (const key of keys) {
    if (record[key] !== undefined) {
      const value = clean(record[key]);
      if (value) return value;
    }
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const found = deepFindValue(value, keys);
      if (found) return found;
    }
  }

  return undefined;
}

function looksUsefulJson(data: unknown): boolean {
  const text = JSON.stringify(data).toLowerCase();

  return [
    "property",
    "parcel",
    "estate",
    "owner",
    "address",
    "zoning",
    "dpnr",
    "acres",
    "island",
    "previewid",
    "properties",
    "displayname",
    "ownername",
  ].some((word) => text.includes(word));
}

function getCandidateObjects(data: unknown): unknown[] {
  const candidates: unknown[] = [];

  if (Array.isArray(data)) {
    candidates.push(...data);
  }

  if (data && typeof data === "object") {
    const obj = data as any;

    if (Array.isArray(obj.features)) {
      for (const feature of obj.features) {
        candidates.push(feature?.attributes ?? feature?.properties ?? feature);
      }
    }

    if (Array.isArray(obj.results)) {
      for (const result of obj.results) {
        candidates.push(
          result?.feature?.attributes ??
            result?.attributes ??
            result?.properties ??
            result
        );
      }
    }

    if (Array.isArray(obj.items)) {
      candidates.push(...obj.items);
    }

    if (Array.isArray(obj.data)) {
      candidates.push(...obj.data);
    }

    candidates.push(
      obj.attributes,
      obj.properties,
      obj.property,
      obj.record,
      obj.data,
      obj
    );
  }

  return candidates.filter(Boolean);
}

function normalizeRecord(data: unknown, sourceUrl: string): PropertyRecord | undefined {
  if (!looksUsefulJson(data)) return undefined;

  for (const obj of getCandidateObjects(data)) {
    const propertyId = deepFindValue(obj, [
      "id",
      "ID",
      "propertyId",
      "Property ID",
      "PROPERTY_ID",
      "PROPERTYID",
      "PROP_ID",
      "prop_id",
      "previewId",
    ]);

    const parcelId = deepFindValue(obj, [
      "parcelId",
      "Parcel ID",
      "PARCEL_ID",
      "PARCELID",
      "PARCEL",
      "parcel",
      "PIN",
      "PID",
    ]);

    const address = deepFindValue(obj, [
      "displayName",
      "address",
      "Address",
      "ADDRESS",
      "SITE_ADDRESS",
      "SITUS_ADDRESS",
      "FULL_ADDRESS",
      "LOCATION",
      "LOC_ADDR",
    ]);

    const estate = deepFindValue(obj, [
      "estate",
      "Estate",
      "ESTATE",
      "ESTATE_NAME",
      "estateName",
    ]);

    const island = deepFindValue(obj, ["island", "Island", "ISLAND"]);

    const owner = deepFindValue(obj, [
      "ownerName",
      "owner",
      "Owner",
      "OWNER",
      "OWNER_NAME",
    ]);

    const ownerAddress = deepFindValue(obj, [
      "ownAddress",
      "ownerAddress",
      "Owner Address",
      "OWNER_ADDRESS",
      "MAIL_ADDRESS",
      "MAILING_ADDRESS",
      "mailingAddress",
    ]);

    const zoning = deepFindValue(obj, [
      "dpnrZone",
      "zoning",
      "ZONING",
      "DPNR_ZONE",
      "DPNR Zone",
      "ZONE",
    ]);

    const acres = deepFindValue(obj, [
      "acre",
      "acres",
      "ACRES",
      "acreage",
      "ACREAGE",
    ]);

    if (propertyId || parcelId || address || estate || owner) {
      return {
        propertyId,
        parcelId,
        address,
        island,
        estate,
        owner,
        ownerAddress,
        zoning,
        acres,
        sourceUrl,
        raw: obj,
      };
    }
  }

  return undefined;
}

function isInterestingUrl(url: string): boolean {
  const lower = url.toLowerCase();

  return (
    lower.includes("mapgeo") ||
    lower.includes("arcgis") ||
    lower.includes("feature") ||
    lower.includes("query") ||
    lower.includes("search") ||
    lower.includes("parcel") ||
    lower.includes("property") ||
    lower.includes("dataset")
  );
}

async function tryReadJson(response: Response): Promise<unknown | undefined> {
  const url = response.url();
  const lower = url.toLowerCase();

  if (!isInterestingUrl(url)) return undefined;

  try {
    const contentType = response.headers()["content-type"] ?? "";

    if (
      contentType.includes("json") ||
      lower.includes("query") ||
      lower.includes("search") ||
      lower.includes("property") ||
      lower.includes("parcel") ||
      lower.includes("dataset")
    ) {
      return await response.json();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function fillSearchBox(page: Page, id: string): Promise<boolean> {
  const candidates = [
    'input[type="search"]',
    'input[placeholder*="Search"]',
    'input[placeholder*="search"]',
    'input[placeholder*="Property"]',
    'input[placeholder*="Parcel"]',
    'input[aria-label*="Search"]',
    'input[aria-label*="search"]',
    "input",
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();

    if ((await locator.count()) === 0) continue;

    try {
      await locator.fill("");
      await locator.fill(id);
      await page.keyboard.press("Enter");
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

async function clickLikelyResult(page: Page, id: string): Promise<void> {
  const candidates = [
    page.locator(`text=${id}`).first(),
    page.locator(`[href*="${id}"]`).first(),
    page.locator(`button:has-text("${id}")`).first(),
  ];

  for (const locator of candidates) {
    try {
      if ((await locator.count()) > 0) {
        await locator.click({ timeout: 5000 });
        return;
      }
    } catch {
      continue;
    }
  }
}

function saveJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function saveProgress(
  records: Map<string, PropertyRecord>,
  networkHits: NetworkHit[],
  searchRequests: SearchRequestHit[]
): void {
  saveJson(OUTPUT_FILE, [...records.values()]);
  saveJson(ENDPOINTS_FILE, networkHits);
  saveJson(REQUESTS_FILE, searchRequests);
}

function captureSearchRequest(
  request: Request,
  searchRequests: SearchRequestHit[]
): void {
  const url = request.url();

  if (!url.includes("/api/datasets/properties/search")) return;

  const hit: SearchRequestHit = {
    url,
    method: request.method(),
    postData: request.postData(),
    headers: request.headers(),
  };

  searchRequests.push(hit);

  console.log("SEARCH REQUEST:", {
    url: hit.url,
    method: hit.method,
    postData: hit.postData,
  });
}

async function main(): Promise<void> {
  ensureDir();

  const parcelIds = loadParcelIds();

  console.log(`Loaded ${parcelIds.length} parcel/property IDs.`);
  console.log(`Opening ${START_URL}`);
  console.log(`Headless: ${HEADLESS}`);

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });

  page.setDefaultTimeout(TIMEOUT_MS);

  const records = new Map<string, PropertyRecord>();
  const networkHits: NetworkHit[] = [];
  const searchRequests: SearchRequestHit[] = [];

  page.on("request", (request) => {
    captureSearchRequest(request, searchRequests);
    saveJson(REQUESTS_FILE, searchRequests);
  });

  page.on("response", async (response) => {
    const data = await tryReadJson(response);
    if (!data) return;

    const url = response.url();
    const sample = JSON.stringify(data).slice(0, 3000);

    networkHits.push({
      url,
      status: response.status(),
      contentType: response.headers()["content-type"],
      sample,
    });

    const record = normalizeRecord(data, url);
    if (!record) {
      saveProgress(records, networkHits, searchRequests);
      return;
    }

    const key =
      record.propertyId ??
      record.parcelId ??
      record.address ??
      `record-${records.size + 1}`;

    records.set(key, record);

    console.log("Captured:", {
      key,
      propertyId: record.propertyId,
      parcelId: record.parcelId,
      address: record.address,
      estate: record.estate,
      owner: record.owner,
    });

    saveProgress(records, networkHits, searchRequests);
  });

  try {
    await page.goto(START_URL, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });

    await sleep(5000);

    for (const id of parcelIds) {
      console.log(`Searching ${id}`);

      const searched = await fillSearchBox(page, id);

      if (!searched) {
        console.warn("Could not find search box. Saving debug files.");
        break;
      }

      await sleep(DELAY_MS);
      await clickLikelyResult(page, id);
      await sleep(DELAY_MS);

      saveProgress(records, networkHits, searchRequests);
    }

    fs.writeFileSync(DEBUG_HTML_FILE, await page.content());
    await page.screenshot({ path: DEBUG_SCREENSHOT_FILE, fullPage: true });
  } finally {
    await browser.close();
  }

  console.log("Done.");
  console.log(`Property records: ${records.size}`);
  console.log(`Saved: ${OUTPUT_FILE}`);
  console.log(`Network hits: ${ENDPOINTS_FILE}`);
  console.log(`Search requests: ${REQUESTS_FILE}`);
  console.log(`Debug HTML: ${DEBUG_HTML_FILE}`);
  console.log(`Debug screenshot: ${DEBUG_SCREENSHOT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});