#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";

const ENGINE_JSON = path.join(process.cwd(), "generated", "dictionary-knowledge-engine.json");
const OUT_JSON = path.join(process.cwd(), "generated", "quarter-feature-links.deduped.json");
const OUT_TS = path.join(process.cwd(), "src/data/quarterFeatureLinks.ts");

type QuarterFeature = {
  entryId: string;
  name: string;
  type: string;
  confidence: number;
  description: string;
};

type QuarterFeatureLink = {
  island: string;
  quarter: string;
  features: QuarterFeature[];
};

function normalize(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const engine = JSON.parse(await fs.readFile(ENGINE_JSON, "utf8")) as {
    quarterFeatureLinks: QuarterFeatureLink[];
  };

  const quarterMap = new Map<string, QuarterFeatureLink>();

  for (const link of engine.quarterFeatureLinks) {
    const island = normalize(link.island);
    const quarter = normalize(link.quarter);
    const quarterKey = `${island}|${quarter}`;

    if (!quarterMap.has(quarterKey)) {
      quarterMap.set(quarterKey, {
        island,
        quarter,
        features: [],
      });
    }

    const target = quarterMap.get(quarterKey)!;
    const featureMap = new Map(target.features.map((f) => [f.entryId, f]));

    for (const feature of link.features ?? []) {
      const existing = featureMap.get(feature.entryId);

      if (!existing || feature.confidence > existing.confidence) {
        featureMap.set(feature.entryId, {
          entryId: feature.entryId,
          name: normalize(feature.name),
          type: normalize(feature.type),
          confidence: Number(feature.confidence ?? 0),
          description: normalize(feature.description),
        });
      }
    }

    target.features = [...featureMap.values()].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.name.localeCompare(b.name);
    });
  }

  const deduped = [...quarterMap.values()]
    .filter((link) => link.features.length > 0)
    .sort((a, b) => {
      if (a.island !== b.island) return a.island.localeCompare(b.island);
      return a.quarter.localeCompare(b.quarter);
    });

  const totalFeatures = deduped.reduce((sum, link) => sum + link.features.length, 0);

  await fs.writeFile(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        quarterCount: deduped.length,
        featureCount: totalFeatures,
        quarterFeatureLinks: deduped,
      },
      null,
      2
    )
  );

  await fs.writeFile(
    OUT_TS,
    `export type QuarterFeatureLink = {
  island: string;
  quarter: string;
  features: Array<{
    entryId: string;
    name: string;
    type: string;
    confidence: number;
    description: string;
  }>;
};

export const quarterFeatureLinks: QuarterFeatureLink[] = ${JSON.stringify(deduped, null, 2)};

export function getQuarterFeatures(island: string, quarter: string) {
  return quarterFeatureLinks.find(
    (link) => link.island === island && link.quarter === quarter
  )?.features ?? [];
}
`
  );

  console.log(`Quarter groups: ${deduped.length}`);
  console.log(`Deduped quarter features: ${totalFeatures}`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});