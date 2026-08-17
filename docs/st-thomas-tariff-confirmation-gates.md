# St. Thomas tariff confirmation gates

The tariff governance layer remains fail-closed. This note records the smallest unresolved external confirmation set after separating safe spelling corrections from route-semantic questions.

## External confirmations still required

1. **Town → Charlotte Amalie**
   - Confirm whether the published tariff endpoint `Town` may be matched to the app endpoint `Charlotte Amalie` for authoritative automatic quoting.
   - Until confirmed, `Town` remains canonical and `Charlotte Amalie` remains a candidate alias only.

2. **Red Hook → Dorothea, two or more passengers**
   - St. Thomas Taxi Association source value: **$15 per person**.
   - Conflicting VInow value: **$16 per person**.
   - Keep this passenger tier confirmation-required until an authoritative source resolves the discrepancy.

## Deliberately narrow mappings — no confirmation needed to stay safe

- `Airport Terminal` does **not** automatically broaden to generic `Lindbergh Bay`.
- `Dorothea` does **not** automatically broaden to `Dorothea Estate`.

These mappings can remain narrow indefinitely without blocking safe operation. A future authoritative confirmation may broaden them deliberately.

## Safe source-text normalizations

The following are treated only as spelling/format normalization and do not broaden geographic scope:

- `Redhook` → `Red Hook`
- `$18,00` → `$18.00`
- `Dorotdea Estate` → `Dorothea Estate`
- `Estate tdomas New Qtr` → `Estate Thomas New Quarter`

## Activation rule

Do not activate authoritative automatic quoting for any route that depends on an unresolved candidate alias or disputed fare. Unknown or unresolved matches must continue to fail closed / require fare confirmation.
