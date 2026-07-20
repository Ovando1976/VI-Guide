# Catalog availability integration

This patch preserves catalog verification metadata through the directory adapter and applies a single availability policy across public discovery.

- Permanently closed records remain addressable by their detail URL but are removed from normal discovery, nearby recommendations, map/Concierge travel feeds, and trip actions.
- Temporarily closed records remain visible with an explicit warning, but ride, reservation, recommendation, and add-to-trip actions are disabled.
- Unconfirmed records remain discoverable and retain their source/confidence disclosure.

After extraction run `npm run typecheck`, `npm run build`, and `npm run catalog:audit`.
