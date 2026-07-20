# Dimensional map icon upgrade

The upgrade uses dependency-free SVG and CSS effects inside Leaflet `DivIcon`
markers. It adds distinct place, beach, historic, stay, driver, pickup,
destination, and estate symbols while retaining the existing exports.

```bash
node scripts/install-3d-map-icons.mjs
node scripts/install-3d-map-icons.mjs --apply
```

The installer locates the existing marker module by its current implementation,
so it does not depend on a guessed filename. Commit the discovered TypeScript
file; the `templates` directory and installer may be omitted from production.
