# Domain Model

This document describes the major business domains in the project.

## Territory

Responsible for the geographic and administrative model of the U.S. Virgin Islands.

Examples:

- estate registry
- coordinates
- polygons
- island metadata
- territory catalog

---

## Travel

Responsible for visitor-facing destinations.

Current domains:

- accommodations
- beaches
- historic sites

Future domains:

- restaurants
- attractions
- trails
- parks

---

## Transportation

Responsible for mobility.

Examples:

- taxi tariffs
- dispatch eligibility
- routing

---

## Booking

Responsible for reservations and trip lifecycle.

Examples:

- bookings
- quotes
- trips
- payouts

---

## Infrastructure

Responsible for external services.

Examples:

- Firebase
- Firestore
- Stripe
- Authentication

---

## Shared Infrastructure

Reusable components shared across domains.

Examples:

- data-utils
- directory-data

These modules should never depend on business domains.
