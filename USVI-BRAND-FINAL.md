# Final USVI brand cleanup

Removes the former yellow VI-tile background, border, and shadow from the
persistent navigation wrapper. The official seal remains 36px and unchanged.

```bash
node scripts/finish-usvi-brand-mark.mjs
node scripts/finish-usvi-brand-mark.mjs --apply
npm run typecheck
npm run build
```
