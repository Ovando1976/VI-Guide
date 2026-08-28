# Bounded Agent Coordination Foundation

This milestone adds a safe coordination substrate and an optional model-backed advisory worker layer to the USVI intelligence system. It is intentionally **not** a free-running swarm.

## Goal

Allow specialist agents to discover that another specialist is needed, share structured work, form a temporary team, and resolve dependency chains while preserving the existing intelligence API, Firebase identity boundary, tool registry, orchestration validation, and human-confirmation requirements.

The worker layer is shadow-only. It can contribute structured observations to the collective, but it cannot directly change the traveler-facing answer or execute tools.

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
    |        |
    |        +--> optional advisory AgentWorker
    |               - structured output only
    |               - no OpenAI tool calls
    |               - minimized traveler context
    |               - runtime revalidates delegation
    |               - max two worker tasks by default
    |
    +--> existing tool registry
             |
             +--> read-only descriptors may be shown as context
             +--> workers receive no callable tools
             +--> writes, execution, high-risk, or confirmation tools are blocked
```

## Safety invariants

1. **Root intent is immutable.** Agents may decompose the user's request, but they cannot add capabilities outside the authorized request.
2. **No arbitrary agents.** Recruitment can only select enabled descriptors from the server-owned registry.
3. **No arbitrary tools.** Collective work uses the existing tool registry; it never receives shell access, raw credentials, or a general network primitive.
4. **Workers have no tool-calling surface.** The model request contains no `tools` field. Eligible read-only tool descriptors are informational context only.
5. **Mutations remain non-autonomous.** Any tool with `write` or `execute` permission is blocked from autonomous collective use.
6. **Confirmation remains authoritative.** `requiresConfirmation` and high-risk tools cannot be executed by the collective.
7. **Worker output is untrusted.** Capability requests are revalidated at the runtime boundary even if the worker adapter is buggy or malicious.
8. **Worker payloads are minimized.** Session IDs, verified user IDs, unrelated saved-memory fields, credentials, and server secrets are excluded.
9. **Bounded resources.** Agent count, tasks, messages, delegation depth, runtime, and worker attempts all have hard limits.
10. **Dependencies are explicit.** A task cannot be claimed until prerequisite tasks are completed.
11. **One user-facing answer.** Specialists coordinate internally; the existing grounded/refined response pipeline remains the final output path.
12. **Failure is non-disruptive.** Worker timeout, malformed output, provider failure, or a disabled worker leaves the deterministic traveler-facing path intact.

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
- a worker may propose a bounded delegation to another authorized specialist;
- the critic can participate without owning the traveler objective.

The root objective, capability ceiling, tool permissions, resource limits, and confirmation requirements do **not** emerge.

## Shadow worker activation

Advisory workers are disabled by default:

```bash
USVI_AGENT_WORKERS_SHADOW=0
```

A reviewed environment may enable them with:

```bash
USVI_AGENT_WORKERS_SHADOW=1
```

Enabling the flag does **not** grant model tool execution. The worker receives a structured task payload and returns one structured contribution with one of these kinds:

- `observation`
- `proposal`
- `challenge`
- `result`
- `delegate`

A `delegate` result is only a request. The runtime independently checks it against the immutable root intent and rejects any authority expansion. Worker results remain internal shadow telemetry and do not directly replace or rewrite the traveler-facing response.

## Verification

Run:

```bash
npm run typecheck
npx tsx scripts/test-agent-coordination.ts
npx tsx scripts/test-agent-worker.ts
npx tsx scripts/test-intelligence-continuity.ts
npm run test:api-contracts
```

The coordination test covers immutable intent, duplicate registration, dependency gating, task ownership, capability escalation rejection, recruitment, and tool safety.

The worker test covers payload minimization, absence of callable model tools, high-risk descriptor filtering, malicious-worker escalation rejection at the runtime boundary, provider failure fallback, and disabled-worker behavior.

See `docs/agent-coordination-review-checklist.md` for the complete promotion gate.

## Next milestone

Do **not** jump directly to autonomous tools. The next milestone should be a deterministic **read-only tool broker** with:

- an explicit per-agent allowlist;
- typed input/output schemas;
- hard timeouts and result-size limits;
- per-call audit records;
- source/evidence provenance;
- zero raw credential exposure;
- no writes, payments, bookings, shell, or unrestricted URLs.

Only after that broker passes adversarial tests should selected read-only calls be considered for worker use.
