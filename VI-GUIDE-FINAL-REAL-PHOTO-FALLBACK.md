# VI Guide final real-photo fallback

This patch fills the remaining directory photo gaps without changing any verified Google Place IDs.

## Install

```bash
tar -xzf public/vi-guide-final-real-photo-fallback.tar.gz -C .
rm -rf .next
npm run build
npm run dev
```

## Behavior

- A verified Place ID remains the first and preferred source.
- If its listing has no photo, the server performs an exact-name, island-aware Google Places search.
- Records without a Place ID use the same guarded search.
- Candidate names must overlap the requested name and resolve to the Virgin Islands before a photo is shown.
- Google contributor attribution remains visible.
- If no safe real photo exists, the card displays the existing branded unavailable state instead of an empty white image area.
- Compound legacy records receive conservative canonical searches for the real property named in the record.

The fallback is read-only. It does not update Firestore.
