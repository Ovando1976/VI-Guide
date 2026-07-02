// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const JSON_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.json";
const TS_PATH = "src/data/history/generated/rigsarkivetMapsAndDrawings.ts";
const DEBUG_DIR = "reports/rigsarkivet-maps-and-drawings/image-resolution";

mkdirSync(DEBUG_DIR, { recursive: true });

function decodeHtml(value: unknown) {
  return String(value || "")
    .replaceAll("&aring;", "å")
    .replaceAll("&Aring;", "Å")
    .replaceAll("&aelig;", "æ")
    .replaceAll("&AElig;", "Æ")
    .replaceAll("&oslash;", "ø")
    .replaceAll("&Oslash;", "Ø")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq<T>(values: T[]) {
  return [...new Set(values)];
}

function viewerItemIdFrom(record: any): string | null {
  return (
    record.viewerItemId ||
    String(record.viewerUrl || "").match(/#(\d+)/)?.[1] ||
    record.bsid ||
    null
  );
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "VI-Guide archive metadata resolver",
    },
  });

  const text = await response.text();

  try {
    return {
      ok: response.ok,
      status: response.status,
      url,
      json: JSON.parse(text),
      text,
    };
  } catch {
    return {
      ok: response.ok,
      status: response.status,
      url,
      json: null,
      text,
    };
  }
}

function extractImageIdsFromApiPayload(payload: unknown, viewerItemId: string) {
  const text = JSON.stringify(payload || {});
  const ids = new Set<string>();

  // Real Rigsarkivet image IDs observed here are 8-digit IDs beginning with 55.
  for (const match of text.matchAll(/\b(55\d{6,})\b/g)) {
    ids.add(match[1]);
  }

  // Fallback: collect larger numeric IDs, but exclude viewer ids and collection ids.
  if (ids.size === 0) {
    for (const match of text.matchAll(/\b(\d{7,})\b/g)) {
      const id = match[1];
      if (id === viewerItemId) continue;
      if (id === "20104126") continue;
      if (id.startsWith("282")) continue;
      ids.add(id);
    }
  }

  return [...ids];
}

async function resolveRecord(record: any) {
  const viewerItemId = viewerItemIdFrom(record);

  if (!viewerItemId) {
    return {
      ...record,
      viewerItemId: null,
      imageIds: [],
      imageResolutionStatus: "missing_viewer_item_id",
    };
  }

  const urls = [
    `https://api.rigsarkivet.dk/ao/v1/billedviser/billed-reference-lister?bsid=${viewerItemId}`,
    `https://api.rigsarkivet.dk/ao/v1/billedviser/indeks-bs?bsid=${viewerItemId}`,
  ];

  const responses = [];

  for (const url of urls) {
    try {
      responses.push(await fetchJson(url));
    } catch (error) {
      responses.push({
        ok: false,
        status: 0,
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  writeFileSync(
    path.join(DEBUG_DIR, `${viewerItemId}.json`),
    JSON.stringify(
      {
        archiveRef: record.archiveRef,
        title: record.title,
        viewerItemId,
        urls,
        responses,
      },
      null,
      2
    )
  );

  const imageIds = uniq(
    responses.flatMap((response) =>
      extractImageIdsFromApiPayload(response.json ?? response.text, viewerItemId)
    )
  );

  return {
    ...record,
    title: decodeHtml(record.title),
    originalTitle: decodeHtml(record.originalTitle || record.title),
    description: decodeHtml(record.description),
    creator: decodeHtml(record.creator),
    places: Array.isArray(record.places) ? record.places.map(decodeHtml) : record.places || [],
    tags: Array.isArray(record.tags) ? record.tags.map(decodeHtml) : record.tags || [],
    viewerItemId,
    imageIds,
    imageResolutionStatus: imageIds.length > 0 ? "resolved" : "unresolved",
  };
}

async function main() {
  const records = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const resolved = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const viewerItemId = viewerItemIdFrom(record);

    console.log(
      `Resolving ${i + 1}/${records.length}: ${record.archiveRef} viewerItemId=${viewerItemId}`
    );

    resolved.push(await resolveRecord(record));

    // Be polite to the API.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  writeFileSync(JSON_PATH, JSON.stringify(resolved, null, 2) + "\n");

  const ts = `/* Auto-generated archive data. */
/* eslint-disable */

export const rigsarkivetMapsAndDrawings = ${JSON.stringify(resolved, null, 2)} as const;

export type RigsarkivetMapAndDrawing = typeof rigsarkivetMapsAndDrawings[number];
`;

  writeFileSync(TS_PATH, ts);

  const imageIds = resolved.flatMap((record) => record.imageIds || []);
  const uniqueImageIds = uniq(imageIds);
  const unresolved = resolved.filter((record) => record.imageResolutionStatus !== "resolved");

  console.log(
    JSON.stringify(
      {
        totalRecords: resolved.length,
        recordsWithImages: resolved.filter((record) => record.imageIds.length > 0).length,
        totalImageIds: imageIds.length,
        uniqueImageIds: uniqueImageIds.length,
        duplicateImageIds: imageIds.length - uniqueImageIds.length,
        unresolvedCount: unresolved.length,
        unresolved: unresolved.slice(0, 10).map((record) => ({
          archiveRef: record.archiveRef,
          title: record.title,
          viewerItemId: record.viewerItemId,
          status: record.imageResolutionStatus,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
