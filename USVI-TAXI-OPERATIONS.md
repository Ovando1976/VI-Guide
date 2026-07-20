# USVI taxi operations contract

This package removes distance pricing, mode multipliers, surge pricing, and invented fees.

## Required reviewed data

- `taxiTariffs`: exactly one active tariff per island, issued by the Virgin Islands Taxicab Commission, with a source URL, effective date, version, and explicit route rules.
- `taxiAssociations`: reviewed association records with an active regulatory status.
- `drivers`: Commission credential, license, association, island authorization, availability, and linked vehicle.
- `vehicles`: association membership, taxi plate, medallion, inspection, insurance, capacities, and active status.

The booking APIs fail closed when an official route or charge is absent. Staff must review and publish the missing rate; the application does not estimate it.

## Tariff rule shape

Each rule must name both endpoints (and should include estate GEOIDs), a one-passenger fare, and either an additional-passenger fare or a per-person fare. Luggage is charged only if the reviewed rule explicitly provides a luggage rate. Service style is stored as a dispatch preference and never changes the fare.

## Assignment

Driver assignment runs in a Firestore transaction and validates association, driver, and vehicle compliance plus capacity. The verified state is snapshotted onto the booking and the driver becomes busy atomically.

