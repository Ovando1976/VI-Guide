import { promises as fs } from "node:fs";
import path from "node:path";

import { determineRole } from "./rules";
import type { ModuleInfo } from "./types";

const ROOTS = ["app", "components", "hooks", "lib", "scripts"] as const;

const EXTENSIONS = new Set([".ts", ".tsx"]);

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "reports",
]);

export async function inventory(root = process.cwd()): Promise<ModuleInfo[]> {
  const modules: ModuleInfo[] = [];

  for (const directory of ROOTS) {
    const absolute = path.join(root, directory);

    try {
      await walk(absolute, root, modules);
    } catch {
      // Directory doesn't exist. Ignore.
    }
  }

  modules.sort((a, b) => a.path.localeCompare(b.path));

  return modules;
}

async function walk(
  directory: string,
  root: string,
  modules: ModuleInfo[]
): Promise<void> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    if (IGNORE_DIRS.has(entry.name)) {
      continue;
    }

    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(absolute, root, modules);
      continue;
    }

    const extension = path.extname(entry.name);

    if (!EXTENSIONS.has(extension)) {
      continue;
    }

    const source = await fs.readFile(absolute, "utf8");

    const relative = normalize(path.relative(root, absolute));

    modules.push({
      path: relative,
      absolutePath: absolute,

      lines: countLines(source),

      imports: [],
      importedBy: [],

      role: determineRole(relative),

      health: "good",

      notes: [],
    });
  }
}

function normalize(file: string): string {
  return file.replaceAll("\\", "/");
}

function countLines(source: string): number {
  if (!source.trim()) {
    return 0;
  }

  return source.split(/\r?\n/).length;
}
