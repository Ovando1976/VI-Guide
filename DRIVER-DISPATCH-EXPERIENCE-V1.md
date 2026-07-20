# VI Guide driver and dispatch experience v1

This patch combines the server-enforced booking workflow with a focused driver
and dispatch interface.

## Driver experience

- Shows only paid, tariff-resolved requests on the driver's authorized islands.
- Prevents accepting a second trip while one is active.
- Requires review before acceptance and confirmation before trip start/completion.
- Provides a one-tap navigation action and a visible trip-progress rail.
- Removes the non-functional rider-message control.
- Labels positioning guidance as operational coverage, never surge pricing.

## Dispatch experience

- Uses the same server-enforced sequential state machine as the driver app.
- Requires a specific cancellation reason for the immutable activity trail.
- Requires confirmation before starting or completing a trip.

## Production tariff behavior

The patch does not promote provisional tariff records to official. The booking
and quote APIs remain responsible for returning the configured quote status and
preventing unresolved routes from entering the paid marketplace.

## Verify after extraction

```sh
npm run typecheck
npm run build
```
