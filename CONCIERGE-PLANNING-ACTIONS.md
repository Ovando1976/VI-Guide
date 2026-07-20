# Concierge planning actions

The Concierge can now return catalog-grounded, user-triggered itinerary actions.

## Actions

- Add a directory-backed place or beach
- Move a saved stop to a specific day and daypart
- Optimize the complete saved trip
- Open My trip
- Remove a saved stop after an explicit confirmation
- Undo the last applied AI plan mutation

## Safety contract

- Additions must match an exact record in server-supplied directory evidence.
- Schedule and removal targets must match a key in the submitted saved plan.
- Removal buttons open a confirmation step and cannot execute silently.
- AI actions modify browser trip state only; they cannot book, dispatch, pay, or contact anyone.
- Mobility actions continue to open the existing review workflow.

## Install and verify

```bash
node scripts/install-concierge-planning-actions.mjs
node scripts/install-concierge-planning-actions.mjs --apply
npm run typecheck
npm run build
```

The apply step removes only the package's temporary
`concierge-actions-template` directory after installation so it is not scanned
as application source by TypeScript.

Test the Concierge with:

- `Add a beach to my trip`
- `Move [saved stop name] to day 2 in the afternoon`
- `Optimize my trip`
- `Remove [saved stop name]`

Confirm that removal requests show Review, Confirm, and Cancel controls and
that every applied plan mutation exposes Undo.
