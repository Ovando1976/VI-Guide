# VI Guide mobility release gates

Run the development gate after every mobility, tariff, dispatch, or driver change:

```sh
npm run mobility:test
```

This validates the sequential booking state machine, payment and assignment
guards, rider/driver cancellation boundaries, tariff structure, unique route
pairs, fare-band coverage, and the presence of one candidate catalog per island.

Run the production gate before every production deployment:

```sh
npm run mobility:release-gate
```

The production gate reads the deployed `taxiTariffs` collection in Firestore and
requires one active, Commission-verified tariff for each of St. Thomas, St. John,
and St. Croix. It is expected to fail while those records remain provisional. Do
not bypass this failure. Configure Firebase Admin credentials before running it.

After Commission review and activation, run:

```sh
npm run tariffs:audit -- --export=reports/active-taxi-tariffs.sanitized.json
npm run mobility:release-gate
npm run typecheck
npm run build
```
