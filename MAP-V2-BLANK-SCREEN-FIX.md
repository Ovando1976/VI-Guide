# Map V2 blank-screen fix

## Root cause

`next build` generated production artifacts in `.next`, then `next dev` tried to
reuse the same directory on CodeSandbox's mounted filesystem. Webpack's cache
rename and Next's server-module reads returned `EIO`, so `/api/estates` never
compiled and the Map remained in its loading shell.

## Repairs

- Development now uses a clean `.next-dev` directory.
- Production build/start continue to use `.next`.
- Webpack persistent pack caching is disabled only in development because the
  mounted filesystem cannot guarantee its atomic rename behavior.
- Static estate geography now loads from the bundled validated snapshot first.
- Firestore and Census remain bounded fallbacks with four-second timeouts.
- The browser estate request aborts after twelve seconds and shows a retryable
  error instead of an endless blank shell.
- The loading shell now communicates what the app is doing.

## Validation

- TypeScript passed.
- ESLint passed without warnings or errors.
- Production build passed all 39 pages.
- The exact `build` then `dev` sequence passed using separate output folders.
- Development `/map`: HTTP 200.
- Development `/api/estates`: HTTP 200 in approximately 0.6 seconds.
- Estate response: 416 records from `local-snapshot`.

## Install

```bash
pkill -f '[n]ext' || true
tar -xzf vi-guide-map-v2-blank-screen-fix.tar.gz -C .
npm run dev
```

Do not run `npm run build` merely to start development. Use `npm run build`
only for production validation; `npm run dev` now owns its separate cache.
