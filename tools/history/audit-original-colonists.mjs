import {
  originalStThomasColonists1678,
  originalStThomasColonists1678Status,
} from "../../src/data/history/colonists/index.ts";

console.log("Original St. Thomas Colonists, 1678");
console.log(originalStThomasColonists1678Status);

for (const colonist of originalStThomasColonists1678) {
  console.log(`${colonist.number}. ${colonist.canonicalName}`);
}
