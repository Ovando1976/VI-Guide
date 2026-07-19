import fs from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

type TextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

function roundY(value: number) {
  return Math.round(value * 10) / 10;
}

function pageItemsToText(items: TextItem[]) {
  const rows = new Map<number, TextItem[]>();

  for (const item of items) {
    if (!item?.str?.trim()) continue;
    const y = Array.isArray(item.transform) ? item.transform[5] : 0;
    const key = roundY(y);
    const bucket = rows.get(key) ?? [];
    bucket.push(item);
    rows.set(key, bucket);
  }

  const sortedRows = [...rows.entries()].sort((a, b) => b[0] - a[0]);

  const lines = sortedRows.map(([, rowItems]) => {
    const sorted = [...rowItems].sort((a, b) => {
      const ax = Array.isArray(a.transform) ? a.transform[4] : 0;
      const bx = Array.isArray(b.transform) ? b.transform[4] : 0;
      return ax - bx;
    });

    let line = "";
    let previousX: number | null = null;

    for (const item of sorted) {
      const x = Array.isArray(item.transform) ? item.transform[4] : 0;

      if (previousX !== null && x - previousX > 12) {
        line += " ";
      }

      line += item.str ?? "";

      const width = typeof item.width === "number" ? item.width : 0;
      previousX = x + width;
    }

    return line.replace(/\s+/g, " ").trimEnd();
  });

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const root = process.cwd();
  const pdfPath = path.join(
    root,
    "data",
    "Geographic Dictionary of the Virgin Islands.pdf"
  );
  const outPath = path.join(root, "data", "geographic-dictionary.txt");

  await fs.access(pdfPath);

  const data = await fs.readFile(pdfPath);
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageText = pageItemsToText(content.items as TextItem[]);

    pages.push(`<PARSED TEXT FOR PAGE: ${i} / ${pdf.numPages}>\n${pageText}\n`);
  }

  const output = pages.join("\n").trim();

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, output, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log(`Pages: ${pdf.numPages}`);
  console.log(`Characters: ${output.length}`);
}

main().catch((error) => {
  console.error("PDF export failed:", error);
  process.exit(1);
});
