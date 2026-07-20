# St. Thomas image recovery — pass 3

Install from the project root, then run:

```bash
npm run stays:recover-stt-images || true
NODE_OPTIONS='--require dotenv/config' npm run stays:seed
rm -rf .next
npm run dev
```

Pass 3 preserves all previously recovered images, adds a direct official
Marriott gallery image for Frenchman's Cove, and searches official responsive
gallery markup, lazy-loaded images, CSS backgrounds, alternate hostnames, and
HTTP/HTTPS variants for sites that do not publish `og:image` metadata.

Review `st-thomas-image-recovery-report.json` after the command. SVG artwork is
retained only when an official site still blocks or exposes no usable photo.
