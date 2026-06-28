import { historyKnowledge } from "../../src/data/history/books/historyKnowledge.ts";

const records = historyKnowledge.filter((record) => {
  const text = [
    record.title,
    record.summary,
    record.significance,
    ...record.relatedPlaces,
    ...record.searchTerms,
  ].join(" ").toLowerCase();

  return (
    text.includes("deed") ||
    text.includes("landholder") ||
    text.includes("estate") ||
    text.includes("plantation boundaries") ||
    record.source.pages === "64–72" ||
    record.source.pages === "255"
  );
});

console.log("Candidate deed / estate records:", records.length);

for (const record of records) {
  console.log("\n---");
  console.log("ID:", record.id);
  console.log("TITLE:", record.title);
  console.log("PAGES:", record.source.pages);
  console.log("PLACES:", record.relatedPlaces.join(", "));
  console.log("SUMMARY:", record.summary.slice(0, 800));
}
