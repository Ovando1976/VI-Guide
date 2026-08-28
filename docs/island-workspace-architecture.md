# Island Workspace — Interface Architecture

## Product decision

USVI Explorer should stop presenting intelligence as a separate chat page beside a map page, mobility page, trip page, and directory pages. The primary experience becomes an **intent-first island workspace**: the traveler states an outcome once and the interface reorganizes around the resulting mission.

Existing routes remain supported as deep links and specialist surfaces. `/island` is the non-destructive proving ground for the new shell.

## Interface model

The workspace has five persistent surfaces:

1. **World Canvas** — spatial and destination context. It owns island focus, reviewed recommendations, route/map handoffs, and eventually the live map itself.
2. **Mission Graph** — the ordered trip/workflow state: what is planned, what is waiting on information, and what requires confirmation.
3. **Evidence Lens** — safe operational evidence from the deterministic orchestration trace and bounded coordination. It never exposes hidden model reasoning, prompts, blackboard contents, secrets, or raw broker evidence.
4. **Agent Work Lens** — public status for recruited specialists. It shows who is working and task status, not private reasoning.
5. **Governed Action Dock** — actions already issued by the server intelligence boundary. Presentation code may arrange these actions but must never mint booking/payment/fare/write/execute authority or remove a confirmation requirement.

A persistent **Ask Island** command dock is the universal input. Conversation is therefore an input modality, not the product container.

## System planes

```text
Traveler intent
     │
     ▼
┌───────────────────────────┐
│ Intelligence plane        │
│ deterministic orchestrator│
│ bounded agent collective  │
│ read-only evidence broker │
└─────────────┬─────────────┘
              │ IntelligenceResponse
              ▼
┌───────────────────────────┐
│ Authority plane           │
│ identity / confirmation   │
│ tariff / booking / money  │
│ deterministic boundaries  │
└─────────────┬─────────────┘
              │ governed response
              ▼
┌───────────────────────────┐
│ Presentation projector    │
│ mission / evidence /      │
│ recommendations / actions │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Island Workspace          │
│ Canvas + Mission + Agent  │
│ Lens + Action Dock        │
└───────────────────────────┘
```

The data plane (Firebase, reviewed directory, heritage, map, tariff, ferry, Stripe) remains behind the existing boundaries. The observability plane (agent canary/admin telemetry) remains separate from traveler-facing rendering.

## Authority invariant

**Increasing model intelligence must not increase infrastructure authority.**

The workspace projector is presentation-only. It may:

- select and summarize reviewed recommendations;
- convert an existing plan into visible mission steps;
- convert safe orchestration/coordination status into public evidence cards;
- carry through server-issued actions unchanged.

It must not:

- create or rewrite payment, booking, mobility dispatch, fare, or write actions;
- weaken `requiresConfirmation`;
- expose root-intent IDs, session IDs, prompts, model responses, blackboard messages, broker query hashes, evidence bodies, credentials, or hidden reasoning;
- infer a fare or booking result when the governing subsystem failed closed.

## Route migration

Phase 1 introduces `/island` without replacing production navigation.

Phase 2 mounts the Living Map directly as the center canvas and projects trip state into the mission rail.

Phase 3 turns Explore, Move, Stay, Eat, Experience, History, and Community into **workspace lenses** while preserving their existing URLs for deep links and SEO.

Phase 4 lets bounded research agents update evidence and mission state over multiple read-only reasoning rounds.

Phase 5 adds shared-trip, merchant, advisor, and driver collaboration as governed workspace participants rather than separate product silos.

## Example

Traveler: “I land at STT at 2 PM, I’m staying in Cruz Bay, and I want dinner at 7.”

The desired interface response is not a long chat message. It becomes:

- World Canvas: STT airport → Red Hook → Cruz Bay focus;
- Mission Graph: arrival → governed taxi quote → ferry → lodging handoff → dinner;
- Evidence Lens: tariff source, ferry evidence, local recommendation evidence, conflicts;
- Agent Work Lens: travel planner, mobility specialist, verification critic;
- Governed Action Dock: only actions the server has actually authorized, with confirmation preserved.

That is the core interface reinvention: **one living mission, many specialist capabilities, one coherent surface.**
