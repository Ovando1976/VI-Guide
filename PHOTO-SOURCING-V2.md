# Final photo sourcing v2

This pass searches both Wikimedia Commons and Openverse using alternate names,
island context, captions, tags, and historic-site variants.

Run from the repository root:

```bash
node scripts/source-final-photo-gaps.mjs --limit=25
```

Repeat until `remaining` reaches zero. Results are written to
`reports/final-photo-source-candidates-v2.json`.

No photo is applied automatically. Every candidate must be visually reviewed;
`review-high` means the text and island matched strongly, not that approval is
automatic. Retain the recorded source URL, creator, and license with each image.
