# Read-Only Agent Tool Broker

This milestone gives bounded advisory agents a deterministic way to request **read-only local evidence** without giving the model a tool-calling surface.

## Core rule

The model never executes a tool.

A worker may return a structured `tool_request`. The server-owned broker independently validates that request. Only after all policy checks pass does a registered local adapter run. Its bounded evidence is posted back to the blackboard, and the worker gets at most one follow-up assessment for that task.

```text
AgentWorker
  |
  | structured tool_request only
  v
ReadOnlyAgentToolBroker
  |
  +-- tool exists in current tool registry
  +-- adapter is server-registered
  +-- agent is explicitly allowlisted
  +-- descriptor is enabled
  +-- descriptor is read-only
  +-- descriptor is not high risk
  +-- no confirmation requirement
  +-- capability is in immutable root intent
  +-- capability is required by claimed task
  +-- capability belongs to claimed agent
  +-- query/result/time limits pass
  |
  v
Local deterministic adapter
  |
  v
Bounded evidence + provenance + privacy-safe audit
  |
  v
Blackboard evidence
  |
  v
AgentWorker follow-up (no second tool request)
```

## Initial adapters

Only two adapters are authorized in this milestone:

- `directory.search` — searches the reviewed in-memory USVI travel knowledge index for the request's island.
- `heritage.search` — searches the existing canonical/reviewed heritage knowledge records.

The broker does **not** expose `booking.review`, mobility execution, map mutation, trip saving, payment, Firestore Admin, arbitrary URLs, general network access, shell access, or code execution.

## Agent allowlist

The broker maintains a server-owned allowlist independent from the model prompt:

- `travel-planner` -> `directory.search`
- `knowledge-specialist` -> `directory.search`, `heritage.search`
- `island-concierge` -> `directory.search`, `heritage.search`

An agent cannot add itself to this allowlist or change the registered adapters.

## Limits

- query: maximum 240 normalized characters;
- query terms: maximum 12;
- results: maximum 5 records;
- record summary: maximum 600 characters;
- source URLs: maximum 3 per record;
- adapter timeout: 1.5 seconds by default, hard capped at 3 seconds;
- broker requests: maximum one successful evidence lookup per worker task;
- model calls: hard capped at 3 across the shadow collective run.

## Audit and privacy

Every attempted broker call creates an audit record with:

- tool id;
- agent id;
- task id;
- capability;
- completed/rejected/failed status;
- policy failure reason when applicable;
- query length;
- truncated SHA-256 query hash;
- result count;
- source systems;
- start time and duration.

The raw query, traveler message, user id, session id, saved memory, model prompt, model response, credentials, and evidence bodies are not written into broker telemetry. Session-bearing collective identifiers must be removed or one-way hashed before telemetry persistence.

## Feature flags

Both layers are opt-in and disabled by default:

```bash
USVI_AGENT_WORKERS_SHADOW=0
USVI_AGENT_TOOL_BROKER_SHADOW=0
```

Enabling the broker flag by itself does nothing if advisory workers remain disabled.

## Promotion gate

Before enabling the broker in a preview environment:

```bash
npm run typecheck
npx tsx scripts/test-agent-coordination.ts
npx tsx scripts/test-agent-worker.ts
npx tsx scripts/test-agent-tool-broker.ts
npx tsx scripts/test-intelligence-continuity.ts
npm run test:api-contracts
npm run test:ui-consistency
npm run build
```

Verify additionally that:

1. `booking.review` is always rejected by the broker.
2. write/execute/high-risk/confirmation tools are rejected even if accidentally added to an agent allowlist.
3. a capability outside the immutable root intent is rejected.
4. a capability not required by the claimed task is rejected.
5. a non-allowlisted agent is rejected.
6. oversized or empty queries fail closed.
7. slow adapters time out and return sanitized failures.
8. adapter results are capped and include provenance.
9. raw queries and session/user identifiers are absent from persisted broker telemetry.
10. tool-like instructions embedded in a search query remain inert local search text.
11. the OpenAI request still contains no `tools` field.
12. the deterministic traveler-facing intelligence result remains authoritative in shadow mode.

## Not authorized next

This milestone is **not** approval for generic tool calling. Do not add arbitrary HTTP, search-engine access, Firestore writes, booking execution, payments, shell access, code execution, deployment controls, secrets, or self-modifying agent permissions to this broker.

The next safe expansion should add one reviewed read-only adapter at a time, with its own schema, allowlist, provenance contract, timeout, result cap, and adversarial test coverage.
