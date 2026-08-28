import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const page = read("app/island/page.tsx");
const workspace = read("components/island-workspace/island-generative-workspace.tsx");
const worldCanvas = read("components/island-workspace/island-living-world-canvas.tsx");

for (const label of [
  "Island",
  "Discover",
  "Move",
  "Stay",
  "Eat",
  "Experience",
  "History",
  "Community",
]) {
  assert(page.includes(`[\"${label}\",`), `Mobile Island lens is missing: ${label}`);
}

assert(
  page.includes('aria-label="Island workspace lenses"') &&
    page.includes("overflow-x-auto") &&
    page.includes("lg:hidden"),
  "Island must expose the lens system as an accessible horizontally scrollable mobile navigation surface.",
);
assert(
  page.includes("pb-[env(safe-area-inset-bottom)]") &&
    page.includes("bottom: max(.5rem, env(safe-area-inset-bottom))"),
  "Island must preserve iOS bottom-safe-area space for the sticky mission command surface.",
);
assert(
  page.includes("isolation: isolate") &&
    page.includes(".island-workspace-page .island-context-map") &&
    page.includes("z-index: 0"),
  "The embedded Living Map must stay isolated from sticky Island workspace chrome.",
);
assert(
  page.includes("top: 52px !important"),
  "The Island workspace header must offset below the mobile lens strip.",
);
assert(
  workspace.includes("sticky bottom-2 z-40") && workspace.includes("CommandDock"),
  "The governed Island command surface must remain sticky and above normal workspace content.",
);
assert(
  worldCanvas.includes('className="island-context-map relative') &&
    worldCanvas.includes("height: min(68dvh, 640px) !important") &&
    worldCanvas.includes("min-height: 520px !important"),
  "The embedded Living Map must retain its bounded mobile viewport contract.",
);

console.log(
  "Island mobile-shell contract passed: all eight lenses remain reachable, iOS safe-area spacing is preserved, the header clears mobile navigation, and Leaflet stays inside the workspace stacking boundary.",
);
