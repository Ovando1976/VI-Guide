import fs from "node:fs";

const files = ["app/page.tsx", "components/home/home-live-status.tsx", "components/home/home-concierge-hub.tsx"];
const sources = Object.fromEntries(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const assertions = [
  ["app/page.tsx", 'label: "My Trip"', "/images/usvi-harbor-hero.jpg"],
  ["components/home/home-live-status.tsx", 'label: "Tours & experiences"', "/images/places/st-john/trunk-bay-overlook-1.jpg"],
  ["components/home/home-concierge-hub.tsx", 'label: "Book a ride"', "/images/mobility/usvi-taxi-van.png"],
  ["components/home/home-concierge-hub.tsx", 'label: "Tonight"', "/images/usvi-harbor-hero.jpg"],
];
for (const [file, anchor, image] of assertions) {
  const source = sources[file];
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex === -1) throw new Error(`${file}: missing ${anchor}`);
  if (!source.slice(anchorIndex, anchorIndex + 700).includes(image)) throw new Error(`${file}: ${anchor} should use ${image}`);
}
console.log("Homepage image intent contract passed.");
