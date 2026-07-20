import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.join(root, "data/fishing/fisher-handbook-2024.json"), "utf8")) as { pages?: Array<{ pdfPage?: number; text?: string }>; sourceFile?: string; disclaimer?: string };
const pdf = path.join(root, "public", String(data.sourceFile ?? "").replace(/^\//, ""));
const species = JSON.parse(fs.readFileSync(path.join(root, "data/fishing/species-2024.json"), "utf8")) as Array<{ id?: string; name?: string; imageUrl?: string; handbookPages?: number[]; verificationAgency?: string }>;
const errors: string[] = [];
if (!Array.isArray(data.pages) || data.pages.length !== 55) errors.push("Expected 55 page records.");
if (data.pages?.some((page, index) => page.pdfPage !== index + 1 || !page.text?.trim())) errors.push("Every page must have ordered source text.");
if (!data.disclaimer?.includes("no legal force")) errors.push("The source disclaimer is missing.");
if (!fs.existsSync(pdf)) errors.push("The source PDF is missing from public documents.");
if (species.length < 20) errors.push("Expected at least 20 normalized species cards.");
if (new Set(species.map((item) => item.id)).size !== species.length) errors.push("Species IDs must be unique.");
if (species.some((item) => !item.name || !item.handbookPages?.length || !item.verificationAgency)) errors.push("Each species card requires a name, source page, and verification agency.");
const missingImages = species.filter((item) => item.imageUrl && !fs.existsSync(path.join(root, "public", item.imageUrl.replace(/^\//, ""))));
if (missingImages.length) errors.push(`${missingImages.length} species-card images are missing.`);
console.table({ pages: data.pages?.length ?? 0, speciesCards: species.length, illustratedCards: species.filter((item) => item.imageUrl).length, sourcePdf: fs.existsSync(pdf), errors: errors.length });
if (errors.length) { errors.forEach((error) => console.error(`ERROR ${error}`)); process.exitCode = 1; }
