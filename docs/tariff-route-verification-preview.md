# Tariff Route Verification Preview

This branch is intentionally preview-only until the production tariff audit is reviewed.

Preview checklist:
- Build succeeds on Vercel.
- `/admin/tariffs` loads for an authenticated admin.
- `Run production audit` reads tariff data only.
- Audit reports STT/STJ/STX counts and blocking findings.
- No tariff activation, mutation, or quote-path behavior changes occur during preview validation.
