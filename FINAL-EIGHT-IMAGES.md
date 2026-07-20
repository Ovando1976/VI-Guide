# Final eight St. Thomas image targets

This pass switches the remaining blocked or outdated property URLs to current
official/authoritative gallery pages for Elysian, Sapphire Beach, Sapphire
Village, Flamboyan on the Bay, Windward Passage, Hotel 1829, Sunset Gardens,
and Pavilions and Pools.

Run from the project root:

```bash
npm run stays:recover-stt-images || true
NODE_OPTIONS='--require dotenv/config' npm run stays:seed
```

Then list any remaining SVG fallbacks:

```bash
NODE_OPTIONS='--require tsx/cjs' node -e "const { ACCOMMODATIONS } = require('./lib/accommodations.ts'); for (const stay of ACCOMMODATIONS) if (stay.island === 'stt' && stay.heroImage.endsWith('.svg')) console.log(stay.slug)"
```
