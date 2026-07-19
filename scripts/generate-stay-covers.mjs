import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("lib/accommodations.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const records = [...source.matchAll(/\{ name: "([^"]+)"[^\n]*island: "(stt|stj|stx)"[^\n]*category: "([^"]+)"[^\n]*location: "([^"]+)"/g)].map(
  ([, name, island, category, location]) => ({ name, island, category, location }),
);

const palettes = {
  resort: ["#032f35", "#087f8c", "#f4c95d"],
  hotel: ["#102a43", "#35617d", "#f6ad55"],
  guesthouse: ["#343148", "#7c5c86", "#f2cf8d"],
  villa: ["#143d33", "#41856f", "#f0c36a"],
  apartment: ["#343a40", "#69757f", "#e7b35a"],
};

function slugify(value) {
  return value.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeXml(value) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;",
  })[character]);
}

function splitTitle(value, maximum = 30) {
  const words = value.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1);
    if (current && `${current} ${word}`.length > maximum && lines.length < 3) lines.push(word);
    else lines[lines.length - 1] = current ? `${current} ${word}` : word;
  }
  return lines;
}

function islandLabel(island) {
  return island === "stt" ? "ST. THOMAS" : island === "stj" ? "ST. JOHN" : "ST. CROIX";
}

function renderCover(record, index) {
  const [dark, mid, accent] = palettes[record.category] ?? palettes.hotel;
  const titleLines = splitTitle(record.name);
  const title = titleLines.map((line, lineIndex) =>
    `<text x="74" y="${290 + lineIndex * 70}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" letter-spacing="-1">${escapeXml(line)}</text>`,
  ).join("\n");
  const shift = (index * 47) % 280;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(record.name)}</title>
  <desc id="description">Branded cover for ${escapeXml(record.name)} in ${escapeXml(record.location)}</desc>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#25b7b1"/><stop offset="1" stop-color="#05717b"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#001b20" flood-opacity=".32"/></filter>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="${930 + shift / 3}" cy="150" r="112" fill="${accent}" opacity=".95"/>
  <path d="M0 515 C180 ${435 + shift / 4}, 330 620, 560 520 S890 420,1200 535 V800 H0Z" fill="url(#sea)"/>
  <path d="M0 585 C220 515, 420 650, 670 570 S970 500,1200 610" fill="none" stroke="#d9fffb" stroke-width="10" opacity=".72"/>
  <path d="M760 500 l90 -160 85 160z M870 500 l110 -205 125 205z" fill="#062e33" opacity=".55"/>
  <g opacity=".9"><path d="M1040 522 v-180" stroke="#071f25" stroke-width="12"/><path d="M1040 350 q-95 -80 -150 5 q90 -17 150 38 q65 -72 150 -28 q-80 4 -150 45" fill="#0b3e39"/></g>
  <g filter="url(#shadow)"><rect x="52" y="72" width="690" height="405" rx="38" fill="#03272c" opacity=".88"/></g>
  <text x="74" y="125" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="800" letter-spacing="5">${islandLabel(record.island)} · ${escapeXml(record.category.toUpperCase())}</text>
  ${title}
  <text x="75" y="${325 + titleLines.length * 70}" fill="#d9fffb" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600">${escapeXml(record.location)}</text>
  <rect x="74" y="420" width="76" height="8" rx="4" fill="${accent}"/>
  <text x="75" y="735" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="4" opacity=".9">VI GUIDE · VERIFIED STAY</text>
</svg>\n`;
}

if (!records.length) throw new Error("No accommodation records found in lib/accommodations.ts");

for (const [index, record] of records.entries()) {
  const directory = path.resolve("public", "images", "stays", record.island);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${slugify(record.name)}.svg`), renderCover(record, index));
}

console.log(`Generated ${records.length} local stay covers.`);
