# Reviewed photo matches

This overlay applies only the visually and geographically defensible matches
from `final-photo-source-candidates-v2.json`. It downloads the original licensed
files, updates the relevant catalog records, and writes a durable attribution
manifest at `public/data/photo-attributions.json`.

Run a dry run, then apply:

```bash
node scripts/apply-reviewed-photo-matches.mjs
node scripts/apply-reviewed-photo-matches.mjs --apply
node scripts/audit-final-photo-gaps.mjs
```

The intentionally rejected candidates include maps, architectural drawings,
nearby-but-different destinations, and images from the wrong island.
