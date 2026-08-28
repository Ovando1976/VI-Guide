import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

function stable(value) {
  return JSON.stringify(value);
}

try {
  const currentText = readFileSync("package-lock.json", "utf8");
  const current = JSON.parse(currentText);
  const previous = JSON.parse(
    execFileSync("git", ["show", "HEAD:package-lock.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );

  const currentPackages = current.packages ?? {};
  const previousPackages = previous.packages ?? {};
  const keys = new Set([
    ...Object.keys(currentPackages),
    ...Object.keys(previousPackages),
  ]);
  const changed = {};

  for (const key of [...keys].sort()) {
    if (stable(currentPackages[key]) === stable(previousPackages[key])) continue;
    changed[key] = currentPackages[key] ?? null;
  }

  console.log("LAUNCH_LOCK_DIFF_START");
  console.log(
    JSON.stringify(
      {
        lockfileVersion: current.lockfileVersion,
        changedPackageCount: Object.keys(changed).length,
        packages: changed,
      },
      null,
      2,
    ),
  );
  console.log("LAUNCH_LOCK_DIFF_END");

  const encoded = gzipSync(Buffer.from(currentText, "utf8")).toString("base64");
  const chunkSize = 6000;
  const chunks = [];
  for (let index = 0; index < encoded.length; index += chunkSize) {
    chunks.push(encoded.slice(index, index + chunkSize));
  }
  console.log(`LAUNCH_LOCK_B64_START:${chunks.length}`);
  chunks.forEach((chunk, index) => {
    console.log(`LAUNCH_LOCK_B64_${index + 1}_OF_${chunks.length}:${chunk}`);
  });
  console.log("LAUNCH_LOCK_B64_END");
} catch (error) {
  console.warn(
    "Launch lock diff unavailable:",
    error instanceof Error ? error.message : String(error),
  );
}
