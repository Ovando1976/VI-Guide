# St. Thomas real property image recovery

From the project root:

```bash
npm run stays:recover-stt-images
NODE_OPTIONS='--require dotenv/config' npm run stays:seed
rm -rf .next
npm run dev
```

The recovery command downloads each property's official social/hero image into
`public/images/accommodations`, updates `data/accommodation-image-sources.json`,
and writes `st-thomas-image-recovery-report.json`. A non-zero exit after the
downloads means one or more sites blocked automation; successfully recovered
images and manifest entries are still retained.

Do not run `stays:covers` afterward. SVG covers remain only as fallbacks for
properties whose official site did not expose a usable image.
