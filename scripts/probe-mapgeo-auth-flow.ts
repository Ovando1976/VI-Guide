// scripts/probe-mapgeo-auth-flow.ts
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://usvi.mapgeo.io";
const OUT = "data/raw/mapgeo-auth-flow-probe.json";

const paths = [
  "/api/oauth/restore",
  "/api/token-refresh/",
  "/api/config/datasets",
  "/api/config/datasets/",
];

async function request(path: string, cookie = "") {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "user-agent": "Mozilla/5.0 VI-Guide MapGeo auth probe",
      accept: "application/json,text/html,*/*",
      ...(cookie ? { cookie } : {}),
    },
  });

  return {
    path,
    status: res.status,
    contentType: res.headers.get("content-type"),
    setCookie: res.headers.get("set-cookie"),
    preview: (await res.text()).slice(0, 1200),
  };
}

async function main() {
  mkdirSync("data/raw", { recursive: true });

  const results = [];
  let cookie = "";

  for (const path of paths) {
    const result = await request(path, cookie);
    results.push(result);

    if (result.setCookie) {
      cookie = result.setCookie.split(";")[0];
    }

    console.log(result.status, path);
  }

  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});