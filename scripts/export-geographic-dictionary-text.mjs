import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";

const PDF_PATH = path.resolve(
  "data/Geographic Dictionary of the Virgin Islands.pdf"
);
const OUTPUT_PATH = path.resolve("data/geographic-dictionary.txt");

async function main() {
  const buffer = await readFile(PDF_PATH);
  const result = await pdf(buffer);

  if (!result.text || !result.text.trim()) {
    throw new Error("No text extracted from PDF.");
  }

  await writeFile(OUTPUT_PATH, result.text, "utf8");
  console.log(`Wrote text export to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("PDF export failed:", error);
  process.exit(1);
});
