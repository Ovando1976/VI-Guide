import { classify } from "./classify";
import { parseArgs, printSummary } from "./cli";
import { buildDependencies } from "./dependencies";
import { createGraph } from "./graph";
import { inventory } from "./inventory";
import { writeReports } from "./report";
import { validate } from "./validation";

async function main() {
  const options = parseArgs();

  const modules = await inventory();

  const graph = createGraph(modules);

  await buildDependencies(graph);
  let edges = 0;

  for (const module of graph.modules.values()) {
    edges += module.imports.length;
  }

  console.log(`Dependency edges: ${edges}`);

  classify(graph);

  const issues = validate(graph);

  await writeReports(graph, issues);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          modules: modules.length,
          issues,
        },
        null,
        2
      )
    );

    return;
  }

  printSummary(graph, issues);

  if (options.check && issues.some((i) => i.level === "error")) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
