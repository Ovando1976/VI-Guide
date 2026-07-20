# Provisional taxi tariff workflow

Use `provisional` for researched tariff transcriptions that support planning but have not yet been verified against a Commission-issued schedule.

## Promote stored drafts to provisional

```bash
for island in stt stj stx; do
  npm run tariffs:import -- \
    --file="data/taxi-tariffs/${island}-2022.json" \
    --provisional \
    --apply || break
done
```

Provisional quotes may be displayed and attached to an official-rate review request. They cannot create a booking, enter dispatch, or authorize payment. The booking and Stripe APIs enforce that boundary server-side.

## Activate after Commission verification

Before activation, attach a `commission_schedule` source, its SHA-256 digest, `approvedAt`, `approvedBy`, and verification notes to the tariff file. Then run the import with `--activate --apply` and audit the stored tariffs.

Never use `--activate` for a transcription-only tariff.
