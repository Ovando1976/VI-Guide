# ADR-0001: Domain-Oriented Module Organization

## Status

Accepted

## Context

The project historically organized large datasets as flat modules under `lib/`.

As the codebase grew, modules accumulated multiple responsibilities:

- data
- search
- validation
- helper functions
- synchronization

This increased coupling and made maintenance harder.

## Decision

Organize business logic by domain.

Each domain owns:

- loader
- search
- types
- utilities
- public exports

Composition modules assemble domains but do not contain domain logic.

## Consequences

Benefits:

- Better cohesion
- Easier testing
- Clear ownership
- Easier synchronization
- Predictable project structure

Tradeoffs:

- More files
- Slightly more imports
- Greater consistency across the project
