# Dependency Map

High-level dependency relationships.

```text
Application
│
├── Territory
│   ├── Estate Registry
│   ├── Coordinates
│   └── Catalog
│
├── Travel
│   ├── Accommodations
│   ├── Beaches
│   └── Historic Sites
│
├── Transportation
│
├── Booking
│
└── Infrastructure
```

## Rules

- Domains must not depend on application code.
- Infrastructure must not depend on domains.
- Composition modules may depend on multiple domains.
- Shared infrastructure must remain domain-agnostic.
