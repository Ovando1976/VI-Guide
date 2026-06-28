import fs from "node:fs";
import path from "node:path";
import { knoxAppendixAColonists } from "../../src/data/history/generated/knoxAppendixAColonists.ts";

const OUT = path.join(
  process.cwd(),
  "src/data/history/generated/knoxAppendixAEntities.ts",
);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const entities = knoxAppendixAColonists.map((colonist) => ({
  id: `person-${slugify(colonist.name)}`,
  kind: "person",
  name: colonist.name,
  aliases: [colonist.name],
  description: `Named in Knox Appendix A as a readable 1678 St. Thomas colonist entitled to an estate. Appendix number ${colonist.number}.`,
  sourceIds: [colonist.sourceRecordId],
  confidence: 0.82,
}));

const output = `import type { HistoryEntity } from "../entities";

export const knoxAppendixAEntities: HistoryEntity[] = ${JSON.stringify(
  entities,
  null,
  2,
)};
`;

fs.writeFileSync(OUT, output);
console.log(`Wrote ${entities.length} Appendix A person entities.`);
console.log(OUT);
