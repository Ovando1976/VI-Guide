// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(ROOT, "reports/applied-geographic-index-ocr-cleanup-batch-3.json");
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const FIXES = [
  {
    index: 79,
    oldName: "Bedhook Bay",
    newName: "Red Hook Bay",
    oldType: "bay",
    newType: "bay",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Bedhook Bay", "Redhook Bay"],
    reason: "Description says inlet between Redhook Point and Cabrita Point near eastern St. Thomas.",
  },
  {
    index: 118,
    oldName: "Beverhout Plantation",
    newName: "Beverhout Plantation",
    oldType: "bay",
    newType: "estate",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Beverhout's Plantage"],
    reason: "Description says Beverhout's Plantage north of Krum Bay, St. Thomas; type is plantation/estate, not bay.",
  },
  {
    index: 119,
    oldName: "Beverhout Point",
    newName: "Beverhout Point",
    oldType: "bay",
    newType: "point",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Ioannis Beuerout Punt"],
    reason: "Description says point at east entrance of Nazareth Bay.",
  },
  {
    index: 123,
    oldName: "Billington Hill",
    newName: "Billington Hill",
    oldType: "bay",
    newType: "hill",
    oldIsland: "st_john",
    newIsland: "st_john",
    aliases: [],
    reason: "Description says 639-foot high hill east of Reef Bay, St. John.",
  },
  {
    index: 133,
    oldName: "Blasbalg Point",
    newName: "Blasbalg Point",
    oldType: "bay",
    newType: "point",
    oldIsland: "st_john",
    newIsland: "st_john",
    aliases: ["Red Cliffs"],
    reason: "Description says point at south side of Calvary Bay entrance, St. John.",
  },
  {
    index: 225,
    oldName: "BtaZley Point",
    newName: "Stalley Point",
    oldType: "estate",
    newType: "point",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["BtaZley Point", "Staley Point", "Mr. Stalky's Punt", "Pointe de Stalley", "Stalleyn Point"],
    reason: "Description says old name of Long Point, southernmost extremity of St. Thomas.",
  },
  {
    index: 228,
    oldName: "Btwmphfar Bay",
    newName: "Stumpy Bay",
    oldType: "bay",
    newType: "bay",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Btwmphfar Bay"],
    reason: "Description explicitly says Stumpy Bay, north shore of St. Thomas.",
  },
  {
    index: 239,
    oldName: "Buhvun Point",
    newName: "Ruhuun Point",
    oldType: "bay",
    newType: "point",
    oldIsland: "st_john",
    newIsland: "st_john",
    aliases: ["Buhvun Point", "Ruhuun", "Rnlivun"],
    reason: "Description says headland west of Rendezvous Bay and notes spelling Ruhuun by Oxholm.",
  },
  {
    index: 280,
    oldName: "Caeey Point",
    newName: "Casey Point",
    oldType: "bay",
    newType: "point",
    oldIsland: "st_john",
    newIsland: "st_john",
    aliases: ["Caeey Point", "K.C. Point"],
    reason: "Description says name suggested for Durloe Point because Durloe Bay was sometimes called K.C.",
  },
  {
    index: 283,
    oldName: "CahrZtaberg",
    newName: "Cabritaberg",
    oldType: "estate",
    newType: "estate",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["CahrZtaberg", "Cabrite"],
    reason: "Description says estate near Mosquito Bay, Southside Quarter, St. Thomas; same as Cabrite.",
  },
  {
    index: 297,
    oldName: "Calvert Point",
    newName: "Calvert Point",
    oldType: "bay",
    newType: "point",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: [],
    reason: "Description says projection between Santa Maria/Tallard and Bordeaux Bays.",
  },
  {
    index: 502,
    oldName: "Compagnles Plantagie",
    newName: "Compagnies Plantagie",
    oldType: "bay",
    newType: "estate",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Compagnles Plantagie", "Sugar Estate"],
    reason: "Description says locally Sugar Estate; OCR Compagnles corrected to Compagnies.",
  },
  {
    index: 839,
    oldName: "FrcdcrUcuted Jlirrbor",
    newName: "Frederiksted Harbor",
    oldType: "bay",
    newType: "bay",
    oldIsland: "st_thomas",
    newIsland: "st_croix",
    aliases: ["FrcdcrUcuted Jlirrbor", "Frederiksted Road"],
    reason: "Description says anchorage in Westend Bay off Frederiksted, St. Croix; same as Frederiksted Road.",
  },
  {
    index: 840,
    oldName: "Frcder2lcs Knoll",
    newName: "Frederik's Knoll",
    oldType: "dictionaryEntry",
    newType: "dictionaryEntry",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Frcder2lcs Knoll", "Frederik Knoll"],
    reason: "Description says same as Frederik Knoll, St. Thomas.",
  },
  {
    index: 848,
    oldName: "Frederdke H a n b",
    newName: "Frederikshaab",
    oldType: "dictionaryEntry",
    newType: "dictionaryEntry",
    oldIsland: "st_croix",
    newIsland: "st_croix",
    aliases: ["Frederdke H a n b"],
    reason: "Description explicitly says Frederikshaab, St. Croix.",
  },
  {
    index: 1986,
    oldName: "Prederikx Bnttcric",
    newName: "Frederik Battery",
    oldType: "historic",
    newType: "historic",
    oldIsland: "st_thomas",
    newIsland: "st_thomas",
    aliases: ["Prederikx Bnttcric", "Frederik's Batterie", "Frederik's Battery"],
    reason: "Description says same as Frederik Battery, St. Thomas.",
  },
  {
    index: 2067,
    oldName: "Rada de Prederiksted",
    newName: "Rada de Frederiksted",
    oldType: "road",
    newType: "bay",
    oldIsland: "st_thomas",
    newIsland: "st_croix",
    aliases: ["Rada de Prederiksted", "Frederiksted Roadstead"],
    reason: "Description says Spanish name of Frederiksted Roadstead.",
  },
];

function json(value: string) {
  return JSON.stringify(value);
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function findRecordBlock(text: string, id: string) {
  const idNeedle = `"id": ${json(id)}`;
  const idAt = text.indexOf(idNeedle);

  if (idAt < 0) {
    throw new Error(`Could not find record id ${id}`);
  }

  const start = text.lastIndexOf("\n  {", idAt);
  const next = text.indexOf("\n  },\n  {", idAt);
  const finalNext = text.indexOf("\n  }\n];", idAt);
  const end = next >= 0 ? next + "\n  }".length : finalNext + "\n  }".length;

  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not locate full record block for ${id}`);
  }

  return { start, end, block: text.slice(start, end) };
}

function replaceField(block: string, key: string, oldValue: string, newValue: string) {
  const from = `"${key}": ${json(oldValue)}`;
  const to = `"${key}": ${json(newValue)}`;

  const count = block.split(from).length - 1;
  if (count !== 1) {
    throw new Error(`Expected exactly one ${key} field ${from}; found ${count}`);
  }

  return block.replace(from, to);
}

function addAliases(block: string, aliases: string[]) {
  const uniqueAliases = [...new Set(aliases.filter(Boolean))];

  for (const alias of uniqueAliases) {
    if (block.includes(json(alias))) continue;

    if (block.includes(`"aliases": []`)) {
      block = block.replace(
        `"aliases": []`,
        `"aliases": [\n      ${json(alias)}\n    ]`
      );
      continue;
    }

    if (block.includes(`"aliases": [`)) {
      block = block.replace(
        `"aliases": [`,
        `"aliases": [\n      ${json(alias)},`
      );
      continue;
    }

    block = block.replace(
      /(\n    "description": )/,
      `\n    "aliases": [\n      ${json(alias)}\n    ],$1`
    );
  }

  return block;
}

function updateRoutes(block: string, newName: string, newIsland: string) {
  block = block.replace(/context=[^"&]*/g, `context=${encode(newName)}`);
  block = block.replace(/q=[^"&]*/g, `q=${encode(newName)}`);
  block = block.replace(/island=[a-z_]+/g, `island=${newIsland}`);
  return block;
}

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

let text = readFileSync(TARGET_FILE, "utf8");

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.before-ocr-cleanup-batch-3.${Date.now()}.ts`
);
writeFileSync(backupFile, text);

const applied = [];

for (const fix of FIXES) {
  const record: any = geographicIndex[fix.index];

  if (!record) {
    throw new Error(`Missing record at index ${fix.index}`);
  }

  if (record.name !== fix.oldName) {
    throw new Error(
      `Index ${fix.index} name mismatch. Expected ${fix.oldName}, got ${record.name}`
    );
  }

  if (record.type !== fix.oldType) {
    throw new Error(
      `Index ${fix.index} type mismatch. Expected ${fix.oldType}, got ${record.type}`
    );
  }

  if (record.island !== fix.oldIsland) {
    throw new Error(
      `Index ${fix.index} island mismatch. Expected ${fix.oldIsland}, got ${record.island}`
    );
  }

  const { start, end, block } = findRecordBlock(text, record.id);
  let nextBlock = block;

  if (fix.oldName !== fix.newName) {
    nextBlock = replaceField(nextBlock, "name", fix.oldName, fix.newName);
  }

  if (fix.oldType !== fix.newType) {
    nextBlock = replaceField(nextBlock, "type", fix.oldType, fix.newType);
  }

  if (fix.oldIsland !== fix.newIsland) {
    nextBlock = replaceField(nextBlock, "island", fix.oldIsland, fix.newIsland);
  }

  nextBlock = addAliases(nextBlock, [fix.oldName, ...(fix.aliases || [])]);
  nextBlock = updateRoutes(nextBlock, fix.newName, fix.newIsland);

  text = text.slice(0, start) + nextBlock + text.slice(end);

  applied.push({
    index: fix.index,
    id: record.id,
    oldName: fix.oldName,
    newName: fix.newName,
    oldType: fix.oldType,
    newType: fix.newType,
    oldIsland: fix.oldIsland,
    newIsland: fix.newIsland,
    reason: fix.reason,
  });
}

writeFileSync(TARGET_FILE, text);

writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      backupFile: path.relative(ROOT, backupFile),
      targetFile: path.relative(ROOT, TARGET_FILE),
      appliedCount: applied.length,
      applied,
      intentionallySkipped: [
        "Battery)",
        "BoPcks Creek",
        "Bt",
        "Frcderickataod",
        "Frederichated",
      ],
      note: "Applied only description-proven OCR/name/type/island fixes. Duplicate-prone Frederiksted variants were intentionally skipped for separate merge handling.",
    },
    null,
    2
  ) + "\n"
);

console.log("OCR cleanup batch 3 applied.");
console.log(`Applied: ${applied.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(
  applied.map((row) => ({
    index: row.index,
    oldName: row.oldName,
    newName: row.newName,
    oldType: row.oldType,
    newType: row.newType,
    oldIsland: row.oldIsland,
    newIsland: row.newIsland,
  }))
);
