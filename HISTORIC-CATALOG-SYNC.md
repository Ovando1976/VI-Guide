# USVI Historic Catalog Sync

This patch adds an authoritative synchronization pipeline for the public U.S. Virgin Islands National Register of Historic Places inventory.

## Run it

From the project root:

```bash
npx tsx scripts/sync-usvi-historic-sites.ts
npx tsx scripts/sync-usvi-historic-sites.ts --apply
npx tsc --noEmit
npm run lint
```

The first command is a dry run. The second updates:

- `data/travel-knowledge/historic-sites.json`
- `data/territory-coordinates.json`
- `data/generated/usvi-historic-sites-audit.json`
- `reports/usvi-historic-sites-audit.md`

## Integrity rules

- Only public, unrestricted NPS records are imported.
- NPS point geometry is treated as a verified public coordinate.
- Large sites and districts represented as polygons receive a representative map point and are explicitly labeled `representative`.
- Missing public coordinates remain unresolved. The script does not guess.
- Existing locally curated historic records and media are preserved.
- Official records receive NRHP reference numbers, listing dates, source URLs, aliases, and coordinate provenance.

The NPS itself cautions that some National Register spatial records—especially complex district boundaries—may contain anomalies. The generated audit report makes the distinction between exact point locations, representative polygon points, and unresolved records visible.
