# USVI Fishing Handbook integration

This package turns the 2024 USVI DPNR Commercial Fisher's Information Handbook into a fully interactive fishing application:

- a searchable `/fishing` guide with links to the exact source PDF page;
- 27 normalized species cards with common names, scientific names, closures, size summaries, and verification authorities;
- date, district, and territorial/federal-water controls that explain whether the handbook matches a closure or prohibition;
- interactive species, closure-calendar, protected-area, and full-handbook views;
- a Fishing module in the connected map workspace;
- concierge retrieval that supplies only the most relevant handbook pages;
- a local concierge fallback and an `open_fishing` action;
- explicit safeguards that the handbook is dated guidance, not live legal clearance;
- an audit confirming all 55 pages and the original PDF are present.

The source PDF remains available at `/documents/fisher-handbook-2024.pdf`. Text embedded in the PDF is preserved page by page. Graphic-heavy regulation tables also include OCR text marked as transcription so the original page remains the authority.

The concierge must never invent or independently approve permits, closures, harvest limits, protected-area rules, or legality. Territorial questions should be confirmed with USVI DPNR; federal-water questions should be confirmed with NOAA Fisheries.

## Install and verify

```bash
tar -xzf components/vi-guide-interactive-fishing-app-v2.tar.gz -C .
node scripts/install-fishing-handbook.mjs --apply
npm run fishing:audit
npm run typecheck
npm run build
```
