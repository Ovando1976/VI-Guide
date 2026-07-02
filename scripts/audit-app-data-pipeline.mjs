import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const reportDir = path.join(ROOT, "reports");
const reportPath = path.join(reportDir, "app-data-pipeline-audit.json");

const checks = [];
const errors = [];
const warnings = [];

function rel(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function sizeOf(p) {
  try {
    return fs.statSync(path.join(ROOT, p)).size;
  } catch {
    return 0;
  }
}

function readText(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}

function addCheck(name, status, details = {}) {
  checks.push({ name, status, ...details });
  if (status === "error") errors.push({ name, ...details });
  if (status === "warning") warnings.push({ name, ...details });
}

function checkFile(p, options = {}) {
  const abs = path.join(ROOT, p);
  const required = options.required !== false;
  const minBytes = options.minBytes ?? 1;

  if (!fs.existsSync(abs)) {
    addCheck(`file:${p}`, required ? "error" : "warning", {
      message: `Missing file: ${p}`,
    });
    return false;
  }

  const size = fs.statSync(abs).size;

  if (size < minBytes) {
    addCheck(`file:${p}`, required ? "error" : "warning", {
      message: `File is too small or empty: ${p}`,
      size,
      minBytes,
    });
    return false;
  }

  addCheck(`file:${p}`, "ok", { size });
  return true;
}

function checkJson(p, options = {}) {
  if (!checkFile(p, options)) return null;

  try {
    const json = JSON.parse(readText(p));
    addCheck(`json:${p}`, "ok", {
      type: Array.isArray(json) ? "array" : typeof json,
      count: Array.isArray(json)
        ? json.length
        : json?.features
          ? json.features.length
          : json && typeof json === "object"
            ? Object.keys(json).length
            : undefined,
    });
    return json;
  } catch (error) {
    addCheck(`json:${p}`, "error", {
      message: `Invalid JSON: ${p}`,
      error: error.message,
    });
    return null;
  }
}

function checkGeoJson(p, options = {}) {
  const json = checkJson(p, options);
  if (!json) return null;

  if (json.type !== "FeatureCollection" || !Array.isArray(json.features)) {
    addCheck(`geojson:${p}`, "error", {
      message: `Expected GeoJSON FeatureCollection with features[]: ${p}`,
      type: json.type,
    });
    return json;
  }

  const featureCount = json.features.length;
  const minFeatures = options.minFeatures ?? 0;

  if (featureCount < minFeatures) {
    addCheck(`geojson:${p}`, "error", {
      message: `GeoJSON has too few features: ${p}`,
      featureCount,
      minFeatures,
    });
  } else {
    addCheck(`geojson:${p}`, "ok", { featureCount });
  }

  return json;
}

function parsePackageScripts() {
  const pkg = checkJson("package.json", { minBytes: 10 });
  if (!pkg) return;

  const scripts = pkg.scripts || {};
  const expectedScripts = [
    "dev",
    "build",
    "atlas:build",
    "atlas:audit",
    "atlas:verify",
  ];

  for (const script of expectedScripts) {
    if (!scripts[script]) {
      addCheck(`package-script:${script}`, script.startsWith("atlas") ? "warning" : "error", {
        message: `Missing package script: ${script}`,
      });
    } else {
      addCheck(`package-script:${script}`, "ok", {
        command: scripts[script],
      });
    }
  }
}

function checkEnv() {
  const envFiles = [".env", ".env.local"].filter(exists);
  const envText = envFiles.map((file) => readText(file)).join("\n");

  const hasMapbox =
    /VITE_MAPBOX_ACCESS_TOKEN\s*=\s*pk\./.test(envText) ||
    /VITE_MAPBOX_TOKEN\s*=\s*pk\./.test(envText) ||
    String(process.env.VITE_MAPBOX_ACCESS_TOKEN || "").startsWith("pk.") ||
    String(process.env.VITE_MAPBOX_TOKEN || "").startsWith("pk.");

  if (!hasMapbox) {
    addCheck("env:mapbox", "warning", {
      message:
        "No Mapbox public token found. IslandMap can render blank or fail if the restored Mapbox map is active.",
      expected: "VITE_MAPBOX_ACCESS_TOKEN=pk.... or VITE_MAPBOX_TOKEN=pk....",
      envFiles,
    });
  } else {
    addCheck("env:mapbox", "ok", { envFiles });
  }
}

function checkSourceReferences() {
  const sourceFiles = [
    "src/components/maps/IslandMap.tsx",
    "src/components/Maps.tsx",
    "src/hooks/useMapPoints.ts",
    "src/data/core/geographicIndex.ts",
    "src/data/core/geographicIndex.data.ts",
    "src/data/core/cleanGeographicIndex.ts",
    "src/data/core/cleanGeographicIndex.data.js",
  ];

  for (const file of sourceFiles) {
    checkFile(file, { required: file.includes("IslandMap") || file.includes("geographicIndex") });
  }

  if (exists("src/components/maps/IslandMap.tsx")) {
    const text = readText("src/components/maps/IslandMap.tsx");

    const urls = [...text.matchAll(/["'`](\/(?:geo|data)\/[^"'`]+)["'`]/g)].map((m) => m[1]);
    const uniqueUrls = [...new Set(urls)];

    if (!uniqueUrls.length) {
      addCheck("IslandMap:public-urls", "warning", {
        message: "No /geo or /data public URLs detected inside IslandMap.tsx.",
      });
    }

    for (const url of uniqueUrls) {
      const publicPath = `public${url}`;
      if (!exists(publicPath)) {
        addCheck(`IslandMap:url:${url}`, "error", {
          message: `IslandMap references ${url}, but ${publicPath} does not exist.`,
        });
      } else {
        addCheck(`IslandMap:url:${url}`, "ok", {
          publicPath,
          size: sizeOf(publicPath),
        });
      }
    }

    if (!text.includes("mapbox-gl")) {
      addCheck("IslandMap:mapbox", "warning", {
        message: "IslandMap.tsx does not import mapbox-gl. This may not be the restored Mapbox IslandMap.",
      });
    } else {
      addCheck("IslandMap:mapbox", "ok");
    }
  }
}

function checkMasterAtlas() {
  const atlasJson = "public/data/atlas/master-atlas.json";
  const atlasIndex = "public/data/atlas/master-atlas.index.json";
  const canonical = "public/data/canonical/master-atlas.json";

  for (const file of [atlasJson, atlasIndex, canonical]) {
    if (exists(file)) checkJson(file, { required: false });
    else {
      addCheck(`atlas-output:${file}`, "warning", {
        message: `Optional atlas output missing: ${file}`,
      });
    }
  }

  const coreDataCandidates = [
    "src/data/core/geographicIndex.data.ts",
    "src/data/core/cleanGeographicIndex.data.js",
  ];

  for (const file of coreDataCandidates) {
    if (!exists(file)) {
      addCheck(`core-data:${file}`, "error", {
        message: `Generated core data file missing: ${file}`,
      });
      continue;
    }

    const size = sizeOf(file);
    const text = readText(file);

    const roughRecordMarkers =
      (text.match(/canonicalName/g) || []).length +
      (text.match(/normalizedName/g) || []).length +
      (text.match(/island/g) || []).length;

    addCheck(`core-data:${file}`, size > 1000 ? "ok" : "warning", {
      size,
      roughRecordMarkers,
    });
  }
}

function checkPublicData() {
  checkGeoJson("public/geo/usvi-estates.geojson", {
    required: true,
    minBytes: 1000,
    minFeatures: 100,
  });

  if (exists("public/geo/usvi-parcels.geojson")) {
    checkGeoJson("public/geo/usvi-parcels.geojson", {
      required: false,
      minBytes: 1,
      minFeatures: 0,
    });
  } else {
    addCheck("geojson:public/geo/usvi-parcels.geojson", "warning", {
      message:
        "Parcel GeoJSON is missing. If IslandMap requires it directly, create a fallback empty FeatureCollection or restore the real file.",
      suggestedFix:
        "mkdir -p public/geo && echo '{\"type\":\"FeatureCollection\",\"features\":[]}' > public/geo/usvi-parcels.geojson",
    });
  }

  const publicDataFiles = [
    "public/data/estate-search-index.json",
    "public/data/nearby-places.json",
    "public/data/places.json",
    "public/data/place-image-manifest.json",
    "public/data/usvi-parcels.index.json",
    "public/data/usvi-parcels.estates.json",
    "public/data/usvi-parcels.mobility.json",
  ];

  for (const file of publicDataFiles) {
    if (exists(file)) checkJson(file, { required: false });
    else {
      addCheck(`public-data:${file}`, "warning", {
        message: `Expected public data file is missing: ${file}`,
      });
    }
  }
}

function checkAppShell() {
  const indexHtml = checkFile("index.html", { minBytes: 10 });
  const mainTsx =
    exists("src/main.tsx") ? "src/main.tsx" : exists("src/main.jsx") ? "src/main.jsx" : null;
  const appTsx =
    exists("src/App.tsx") ? "src/App.tsx" : exists("src/App.jsx") ? "src/App.jsx" : null;

  if (!mainTsx) {
    addCheck("app-shell:main", "error", {
      message: "Missing src/main.tsx or src/main.jsx.",
    });
  } else {
    checkFile(mainTsx);
    const text = readText(mainTsx);
    if (!text.includes("createRoot")) {
      addCheck("app-shell:createRoot", "warning", {
        message: `${mainTsx} does not appear to call React createRoot.`,
      });
    } else {
      addCheck("app-shell:createRoot", "ok", { file: mainTsx });
    }
  }

  if (!appTsx) {
    addCheck("app-shell:App", "error", {
      message: "Missing src/App.tsx or src/App.jsx.",
    });
  } else {
    checkFile(appTsx);
    const text = readText(appTsx);
    const hasMapRoute = /path=["']\/map["']|\/map/.test(text);
    addCheck("app-shell:map-route", hasMapRoute ? "ok" : "warning", {
      message: hasMapRoute
        ? "Map route appears to be referenced."
        : "Could not detect a /map route in App.",
      file: appTsx,
    });
  }

  return indexHtml;
}

function checkGitIgnore() {
  if (!exists(".gitignore")) {
    addCheck("gitignore", "warning", {
      message: ".gitignore missing.",
    });
    return;
  }

  const text = readText(".gitignore");

  for (const pattern of [".env.local", "node_modules", "dist"]) {
    if (!text.includes(pattern)) {
      addCheck(`gitignore:${pattern}`, "warning", {
        message: `.gitignore does not include ${pattern}`,
      });
    } else {
      addCheck(`gitignore:${pattern}`, "ok");
    }
  }
}

function printSummary() {
  const okCount = checks.filter((c) => c.status === "ok").length;

  const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    totals: {
      checks: checks.length,
      ok: okCount,
      warnings: warnings.length,
      errors: errors.length,
    },
    errors,
    warnings,
    checks,
  };

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log("");
  console.log("App Data Pipeline Audit");
  console.log("=======================");
  console.log(`Root: ${ROOT}`);
  console.log(`Checks: ${checks.length}`);
  console.log(`OK: ${okCount}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Report: ${rel(reportPath)}`);
  console.log("");

  if (errors.length) {
    console.log("Errors");
    console.log("------");
    for (const error of errors) {
      console.log(`- ${error.name}: ${error.message || "failed"}`);
      if (error.suggestedFix) console.log(`  Fix: ${error.suggestedFix}`);
    }
    console.log("");
  }

  if (warnings.length) {
    console.log("Warnings");
    console.log("--------");
    for (const warning of warnings) {
      console.log(`- ${warning.name}: ${warning.message || "warning"}`);
      if (warning.suggestedFix) console.log(`  Fix: ${warning.suggestedFix}`);
    }
    console.log("");
  }

  if (errors.length) {
    process.exitCode = 1;
  }
}

parsePackageScripts();
checkEnv();
checkAppShell();
checkSourceReferences();
checkMasterAtlas();
checkPublicData();
checkGitIgnore();
printSummary();
