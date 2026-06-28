// scripts/read-mapgeo-config.ts

const URL = "https://usvi.mapgeo.io";

async function main() {
  const res = await fetch(URL, {
    headers: {
      "user-agent": "Mozilla/5.0 VI-Guide MapGeo config reader",
      accept: "text/html,*/*",
    },
  });

  const html = await res.text();

  const match = html.match(
    /<meta\s+name=["']map\/config\/environment["']\s+content=["']([^"']+)["']/i
  );

  if (!match) {
    throw new Error("Could not find MapGeo environment meta tag.");
  }

  const decoded = decodeURIComponent(match[1]);
  const config = JSON.parse(decoded);

  console.log(JSON.stringify(config, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});