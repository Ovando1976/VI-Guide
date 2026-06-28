import { historyKnowledge, searchHistoryKnowledge } from "../../src/data/history/books/historyKnowledge.ts";

const queries = [
  "Doppels",
  "Jørgen Iversen",
  "Christian Fort",
  "Fort Christian",
  "Blackbeard",
  "1678 deeds",
  "early landholders",
  "plantation boundaries",
  "Appendix A",
  "Estate Tutu",
  "Magens Bay Estate",
  "Government House",
  "Charles Wheeler",
  "Marcus Gjøe",
  "Christian V",
  "Royal Danish West India Company",
  "early colonists",
  "Christian's Fort",
  "Bluebeard",
];

console.log(`History records indexed: ${historyKnowledge.length}`);
console.log("");

for (const query of queries) {
  const results = searchHistoryKnowledge(query);

  console.log(`QUERY: ${query}`);
  console.log(`MATCHES: ${results.length}`);

  for (const record of results.slice(0, 5)) {
    console.log(`- ${record.title} (${record.source.title}, ${record.source.pages})`);
  }

  console.log("");
}
