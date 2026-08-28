# Bounded Agent Coordination Review Checklist

Use this checklist before merging the bounded collective and again before enabling model-backed advisory workers in any environment.

## Merge gate for the coordination foundation

- [ ] `npm run typecheck`
- [ ] `npx tsx scripts/test-agent-coordination.ts`
- [ ] `npx tsx scripts/test-agent-worker.ts`
- [ ] `npx tsx scripts/test-intelligence-continuity.ts`
- [ ] `npm run test:api-contracts`
- [ ] Confirm `/api/intelligence` remains backward-compatible when `orchestration.coordination` is present.
- [ ] Confirm `/api/admin/agents/events` remains admin-only and does not expose raw traveler messages, model prompts, worker outputs, or credentials.
- [ ] Confirm booking/high-risk tools remain listed under `blockedAutonomousTools`.
- [ ] Confirm no tool with `write` or `execute` permission appears in `safeAutonomousTools`.
- [ ] Confirm every recruited specialist capability is contained in the immutable root intent.
- [ ] Confirm task/message/agent/depth/runtime limits fail closed when exceeded.
- [ ] Confirm `USVI_AGENT_WORKERS_SHADOW` defaults to `0` in environment templates.

## Production invariants

1. The existing authenticated API boundary remains authoritative.
2. The deterministic intelligence orchestrator remains the traveler-facing source of truth while workers are in shadow mode.
3. The collective may plan and coordinate only inside authorized capabilities.
4. Agent recruitment is restricted to the server-owned registry.
5. High-risk, confirmation-gated, write, and execute tools are non-autonomous.
6. Advisory workers receive **no callable tools**. Read-only tool descriptors are context only.
7. Workers receive a minimized traveler context; session IDs, user IDs, unrelated memory, credentials, and server secrets must not enter worker payloads.
8. Worker output is untrusted and is revalidated by the runtime before it can change blackboard state.
9. The collective receives no shell access, raw credentials, unrestricted network primitive, or direct Firebase Admin authority.
10. One traveler request produces one final grounded/refined answer; worker output cannot directly replace that answer.
11. Worker failure, timeout, malformed output, or unavailable model must fail closed and leave the existing traveler-facing engine usable.

## Advisory worker enablement gate

Before setting `USVI_AGENT_WORKERS_SHADOW=1` in preview or production, capture evidence for all of the following:

- [ ] Capability-escalation attempts are rejected a second time at the runtime boundary, even if the worker adapter itself is malicious or buggy.
- [ ] Prompt-injection text inside traveler input or blackboard messages remains inert data and cannot expand authority.
- [ ] The OpenAI request contains no `tools` field and therefore exposes no model tool-calling surface.
- [ ] High-risk, confirmation-gated, write, and execute tool descriptors are not included in a worker task payload.
- [ ] Session IDs, verified user IDs, unrelated saved-memory fields, API keys, and credentials are absent from serialized worker payloads.
- [ ] Worker timeout and provider failure produce a sanitized failure result and do not leak provider error details into telemetry.
- [ ] Duplicate task claims remain impossible.
- [ ] Dependency cycles or invalid dependencies fail closed.
- [ ] Event telemetry stores worker status/counts only, not raw traveler messages, blackboard content, model prompts, or model responses.
- [ ] Booking and mobility confirmation requirements remain unchanged when shadow workers are enabled.
- [ ] The deterministic result is identical in authority when workers are disabled, unavailable, or failing.
- [ ] Cost and latency are measured with the current default cap of two worker tasks per traveler request before increasing that cap.

## Automated evidence currently added

`scripts/test-agent-worker.ts` covers:

- minimized worker payloads;
- no callable OpenAI tools;
- filtering of high-risk booking descriptors;
- malicious worker capability-escalation rejection at the runtime boundary;
- worker failure fallback;
- worker-disabled behavior.

`scripts/test-agent-coordination.ts` continues to cover immutable root intent, recruitment, dependencies, concurrency, and tool safety.

## Not authorized by this milestone

Do **not** enable any of the following yet:

- model-driven tool execution;
- autonomous booking or payment actions;
- Firestore writes initiated by a worker;
- arbitrary URLs or unrestricted web requests;
- shell or code execution;
- credential access;
- worker modification of the root intent, policy, registry, or tool permissions;
- persistent cross-user blackboard communication.

The next promotion step after shadow-worker evidence is green should be a reviewed read-only tool broker with deterministic allowlisting and per-call audit records—not direct tool access from the model.
