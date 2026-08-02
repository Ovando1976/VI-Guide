# Library of Congress gallery build fix

The failed Vercel build referenced two unescaped apostrophes in `app/heritage/library-of-congress/page.tsx`.

The current `main` source uses HTML entities in both JSX text locations:

- `Jack Delano&apos;s`
- `Library&apos;s public API`

The gallery image element also carries a local ESLint suppression for `@next/next/no-img-element`, so that warning does not block production builds.

This commit intentionally triggers a fresh deployment from the corrected `main` branch.
