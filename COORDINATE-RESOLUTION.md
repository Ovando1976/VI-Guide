# Territory Coordinate Resolution

This upgrade creates one coordinate registry for every mapped directory entity and prevents uncertain matches from appearing at an incorrect location.

## Run the audit

```bash
npm run coordinates:audit
```

The audit queries Google Places but does not change files.

## Resolve and save verified coordinates

```bash
npm run coordinates:resolve
```

High-confidence matches are written to:

- `data/territory-coordinates.json`

Ambiguous, missing, or off-island matches are written to:

- `data/territory-coordinate-quarantine.json`

## Retry quarantined entries

After correcting a name, address, or location hint:

```bash
npm run coordinates:retry
```

The territory catalog automatically consumes the coordinate registry. Places without a verified source coordinate or a high-confidence registry match remain unpositioned and therefore do not render a misleading map icon.
