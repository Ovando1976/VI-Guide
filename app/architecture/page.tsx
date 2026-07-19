import { promises as fs } from "node:fs";
import path from "node:path";

import Graph from "./Graph";
import type { ArchitectureGraph } from "./types";

export const dynamic = "force-dynamic";

async function loadGraph(): Promise<ArchitectureGraph> {
  const file = path.join(
    process.cwd(),
    "reports",
    "architecture",
    "graph.json",
  );

  const json = await fs.readFile(file, "utf8");

  return JSON.parse(json);
}

export default async function ArchitecturePage() {
  const graph = await loadGraph();

  return (
    <main className="flex h-screen flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">
          Architecture Inspector
        </h1>

        <p className="text-sm text-muted-foreground">
          {graph.nodes.length} modules •{" "}
          {graph.edges.length} dependencies
        </p>
      </header>

      <div className="flex-1 overflow-hidden">
        <Graph graph={graph} />
      </div>
    </main>
  );
}