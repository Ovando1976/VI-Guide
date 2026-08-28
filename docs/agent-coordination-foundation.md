# Bounded Agent Coordination Foundation

This milestone adds a safe coordination substrate for the USVI intelligence system. It is intentionally **not** a free-running swarm.

## Goal

Allow specialist agents to discover that another specialist is needed, share structured work, form a temporary team, and resolve dependency chains while preserving the existing intelligence API, Firebase identity boundary, tool registry, orchestration validation, and human-confirmation requirements.

## Architecture

```text
Traveler request
    |
    v
Existing API identity + normalization boundary
    |
    v
Existing deterministic intelligence orchestrator
    |
    +--> immutable root intent
    |        |
    |        v
    |    bounded collective
    |      - agent registry
    |      - shared blackboard
    |      - task dependencies
    |      - capability-based recruitment
    |      - critic / guardian roles
    |      - hard resource limits
    |
    +--> existing tool registry
             |
             +--> low/medium-risk read-only tools may be autonomous
             +--> writes, execution, high-risk, or confirmation tools are blocked
```

## Safety invariants

1. **Root intent is immutable.** Agents may decompose the user's request, but they cannot add capabilities outside the authorized request.
2. **No arbitrary agents.** Recruitment can only select enabled descriptors from the server-owned registry.
3. **No arbitrary tools.** Collective work uses the existing tool registry; it never receives shell access, raw credentials, or a general network primitive.
4. **Mutations remain non-autonomous.** Any tool with `write` or `execute` permission is blocked from autonomous collective use.
5. **Confirmation remains authoritative.** `requiresConfirmation` and high-risk tools cannot be executed by the collective.
6. **Bounded resources.** Agent count, tasks, messages, delegation depth, and runtime all have hard limits.
7. **Dependencies are explicit.** A task cannot be claimed until prerequisite tasks are completed.
8. **One user-facing answer.** Specialists coordinate internally; the existing grounded/refined response pipeline remains the final output path.

## Initial agent registry

- **Island Concierge** — root objective and cross-domain coordination.
- **Travel Planner** — recommendation and itinerary feasibility.
- **Mobility Coordinator** — map, taxi, ferry, and transfer dependencies.
- **Booking Guardian** — booking boundary and confirmation protection.
- **USVI Knowledge Specialist** — geography, heritage, and local grounding.
- **Verification Critic** — challenges assumptions and evidence gaps.

## What is emergent versus scripted

The registry and safety envelope are explicit. The useful emergent behavior comes from what can happen *inside* that envelope:

- an active agent may create a subtask;
- the subtask declares the capability it needs;
- the runtime may recruit a different specialist without a fixed call chain;
- specialists communicate through the blackboard;
- newly completed dependencies make downstream tasks claimable;
- the critic can participate without owning the traveler objective.

The root objective, capability ceiling, tool permissions, and resource limits do **not** emerge.

## Current milestone

The production orchestrator now emits a coordination plan in its orchestration metadata. This proves team formation and safety policy without allowing model-driven autonomous execution yet.

Run the focused contract test with:

```bash
npx tsx scripts/test-agent-coordination.ts
```

The test covers:

- immutable root intent;
- duplicate agent rejection;
- dependency gating;
- single-claim task ownership;
- capability escalation rejection;
- dynamic specialist recruitment;
- read-only tool allowlisting;
- booking/high-risk tool blocking.

## Next milestone

Add a model-backed `AgentWorker` adapter behind the same policy boundary. Each worker will receive only:

- the immutable root intent;
- its claimed task;
- relevant blackboard messages;
- its own allowed tool descriptors;
- a structured output schema for `observation`, `proposal`, `challenge`, `result`, or bounded `delegate`.

No worker should receive raw secrets, direct Firebase Admin access, unrestricted URLs, shell access, or authority to modify the root intent.
