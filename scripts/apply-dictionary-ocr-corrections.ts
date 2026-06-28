#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";

const IN = path.join(process.cwd(), "src/data/dictionaryGraph.ts");
const JSON_IN = path.join(process.cwd(), "generated/dictionary-graph.json");
const JSON_OUT = path.join(process.cwd(), "generated/dictionary-graph.corrected.json");

const NAME_FIXES: Record<string, string> = {
  "A'aint Jantcrr": "Saint James",
  "Abada Eklll": "Abattoir Hill",
  "AfanchineaE Bail": "Manchenil Bay",
  "Afingo Pohrt": "Mingo Point",
  "AfuhZenfeZa Batterie": "Muhlenfels Battery",
  "Altse du Bois Abattu": "Anse du Bois Abattu",
  "Amesen": "Arnesen",
  "An86 Beau Regard": "Anse Beau Regard",
  "An8e de la Pointe Rouge": "Anse de la Pointe Rouge",
  "An8e des Plumes": "Anse des Plumes",
  "Anae du N w d": "Anse du Nord",
  "Anee de l'Eetanfl": "Anse de l'Étang",
  "Anee de saint Jean": "Anse de Saint Jean",
  "Anee du B u d": "Anse du Sud",

  "Anne-Deurlnts-Bay": "Anne de Wint's Bay",
  "Anneberg": "Annaberg",
  "Annedevindtebay": "Anne de Wint's Bay",
  "Anse clu Batteau": "Anse du Batteau",
  "Anse d e Iketan": "Anse de l'Étang",
  "Anse d G a b t": "Anse à Galet",
  "Anse d m Pdpes": "Anse des Palétuviers",
  "Anse de SabZe Pin": "Anse de Sable Fin",
  "Anse de Za Lande": "Anse de la Lande",
  "Anse de8 Lambis": "Anse des Lambis",
  "Anse de8 Partuuiers": "Anse des Palétuviers",
  "Anse des Bois Jauneu": "Anse des Bois Jaunes",
  "Anse des Rurgots": "Anse des Burgots",
  "Anse du Galel": "Anse du Galet",
  "Anso des Dunee": "Anse des Dunes",
  "Arons": "Aaron's",
  "Augustti": "Augustus",
};

function fixText(value: string) {
  let text = value;

  const replacements: Array<[RegExp, string]> = [
    [/St\.?\s*Thomns/gi, "St. Thomas"],
    [/St\.?\s*Crolx/gi, "St. Croix"],
    [/St\.?\s*Oroix/gi, "St. Croix"],
    [/Uroix/gi, "Croix"],
    [/Bag\b/g, "Bay"],
    [/Buy\b/g, "Bay"],
    [/Ray\b/g, "Bay"],
    [/Pohrt\b/g, "Point"],
    [/Iat\./gi, "lat."],
    [/LBt\./gi, "lat."],
    [/long\./gi, "long."],
    [/Elstate/gi, "Estate"],
    [/Flatate/gi, "Estate"],
    [/HI11/g, "Hill"],
    [/mftp/gi, "map"],
    [/posslbly/gi, "possibly"],
    [/meanlng/gi, "meaning"],
    [/meuning/gi, "meaning"],
    [/Weeteiid/gi, "Westend"],
    [/Westelid/gi, "Westend"],
    [/Southweat/gi, "Southwest"],
    [/Cottongrove/gi, "Cotton Grove"],
    [/Hobin Bay/gi, "Robin Bay"],
    [/Uape Cudejarre/gi, "Cape Cudejarre"],
    [/Atkina/g, "Atkins"],
    [/Bnrk Island/gi, "Buck Island"],
    [/Cnyo Vertle/gi, "Cayo Verde"],
    [/Groen Ryland/gi, "Groen Eyland"],
    [/Ordn Key/gi, "Grøn Key"],
    [/Alqo cnllecl/gi, "Also called"],
    [/\s+/g, " "],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text.trim();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const graph = JSON.parse(await fs.readFile(JSON_IN, "utf8"));

  graph.nodes = graph.nodes.map((node: any) => {
    const correctedLabel = NAME_FIXES[node.label] ?? node.label;
    const correctedDescription = fixText(
      String(node.description ?? "").replace(
        new RegExp(`^${node.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")};?`),
        `${correctedLabel};`
      )
    );

    return {
      ...node,
      originalLabel: node.originalLabel ?? node.label,
      label: correctedLabel,
      correctedLabel,
      normalizedLabel: slug(correctedLabel),
      description: correctedDescription,
      correctedDescription,
    };
  });

  await fs.writeFile(JSON_OUT, JSON.stringify(graph, null, 2));

  const ts = `export type DictionaryGraphNode = {
  id: string;
  type:
    | "dictionary_entry"
    | "estate"
    | "quarter"
    | "coordinate"
    | "standalone_place";
  label: string;
  originalLabel?: string;
  correctedLabel?: string;
  normalizedLabel?: string;
  island: string | null;
  quarter: string | null;
  featureType: string | null;
  description: string | null;
  correctedDescription?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DictionaryGraphRelationship = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  confidence: number;
  source: string;
};

export const dictionaryGraph = ${JSON.stringify(graph, null, 2)};

export function getDictionaryNodeById(id: string) {
  return dictionaryGraph.nodes.find((node) => node.id === id) ?? null;
}

export function getRelationshipsForNode(id: string) {
  return dictionaryGraph.relationships.filter(
    (rel) => rel.sourceId === id || rel.targetId === id
  );
}

export function getConnectedDictionaryNodes(id: string) {
  const relationships = getRelationshipsForNode(id);
  const ids = new Set(
    relationships.flatMap((rel) => [rel.sourceId, rel.targetId]).filter((nodeId) => nodeId !== id)
  );

  return dictionaryGraph.nodes.filter((node) => ids.has(node.id));
}

export function searchDictionaryGraph(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return dictionaryGraph.nodes.slice(0, 300);

  return dictionaryGraph.nodes.filter((node) =>
    node.label.toLowerCase().includes(q) ||
    String(node.originalLabel ?? "").toLowerCase().includes(q) ||
    String(node.description ?? "").toLowerCase().includes(q)
  );
}
`;

  await fs.writeFile(IN, ts);

  console.log(`Corrected dictionary graph labels/descriptions`);
  console.log(`Wrote ${JSON_OUT}`);
  console.log(`Wrote ${IN}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});