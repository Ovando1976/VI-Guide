# USVI brand-mark polish

This small follow-up keeps the homepage seal unchanged and reduces only the
persistent navigation seal to an optically balanced 36px. It is idempotent and
does not touch unrelated navigation styling.

```bash
node scripts/polish-usvi-brand-mark.mjs
node scripts/polish-usvi-brand-mark.mjs --apply
npm run typecheck
npm run build
```
