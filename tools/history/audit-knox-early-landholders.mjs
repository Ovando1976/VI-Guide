import { historyKnowledge } from "../../src/data/history/books/historyKnowledge.ts";
import { knoxAppendixAColonists } from "../../src/data/history/generated/knoxAppendixAColonists.ts";

const pageTargets = new Set(["64–72", "64-72", "255"]);

const records = historyKnowledge.filter((record) => {
  const pages = String(record.source.pages);
  const text = [
    record.id,
    record.title,
    record.summary,
    record.significance,
    ...record.relatedPlaces,
    ...record.searchTerms,
  ].join(" ").toLowerCase();

  return (
    pageTargets.has(pages) ||
    record.id.includes("64") ||
    record.id.includes("72") ||
    text.includes("early deed") ||
    text.includes("early landholder") ||
    text.includes("plantation boundaries")
  );
});

console.log("Knox early landholder/deed records:", records.length);

for (const record of records) {
  console.log("\n---");
  console.log("ID:", record.id);
  console.log("TITLE:", record.title);
  console.log("PAGES:", record.source.pages);
  console.log("RELATED PLACES:", record.relatedPlaces.join(", "));
  console.log("SUMMARY:", record.summary);
}

console.log("\nAppendix A colonists:", knoxAppendixAColonists.length);
console.log(knoxAppendixAColonists.map((c) => `${c.number}. ${c.name}`).join("\n"));
