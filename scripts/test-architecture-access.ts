import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layout = fs.readFileSync(path.join(root, "app/architecture/layout.tsx"), "utf8");
const page = fs.readFileSync(path.join(root, "app/architecture/page.tsx"), "utf8");
const middleware = fs.readFileSync(path.join(root, "middleware.ts"), "utf8");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Architecture access contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["getSession", "Architecture verifies the Firebase-backed application session"],
  ['redirect("/login?next=/architecture")', "unauthenticated Architecture access returns through login"],
  ['session.role !== "admin"', "Architecture is restricted to the admin role"],
  ['redirect("/unauthorized")', "non-admin Architecture access uses the restricted-access surface"],
] as const) {
  expectSource(layout, value, label);
}

expectSource(
  middleware,
  '"/architecture/:path*"',
  "Architecture participates in the authenticated middleware boundary",
);

for (const [value, label] of [
  ['"reports",\n    "architecture",\n    "graph.json"', "inspector still reads the generated architecture graph"],
  ["<Graph graph={graph} />", "Architecture graph renderer remains intact"],
  ["graph.nodes.length", "module count remains visible to authorized admins"],
  ["graph.edges.length", "dependency count remains visible to authorized admins"],
] as const) {
  expectSource(page, value, label);
}

console.log("VI Guide Architecture Inspector access contracts passed.");
