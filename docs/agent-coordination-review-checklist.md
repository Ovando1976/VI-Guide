# Bounded Agent Coordination Review Checklist

Use this checklist before promoting the bounded collective from shadow planning to any model-backed worker execution.

## Merge gate for this milestone

- [ ] `npm run typecheck`
- [ ] `npx tsx scripts/test-agent-coordination.ts`
- [ ] `npx tsx scripts/test-intelligence-continuity.ts`
- [ ] `npm run test:api-contracts`
- [ ] Confirm `/api/intelligence` response remains backward-compatible when `orchestration.coordination` is present.
- [ ] Confirm `/api/admin/agents/events` remains admin-only and does not expose raw traveler messages or credentials.
- [ ] Confirm booking/high-risk tools remain listed under `blockedAutonomousTools`.
- [ ] Confirm no tool with `write` or `execute` permission appears in `safeAutonomousTools`.
- [ ] Confirm every recruited specialist capability is contained in the immutable root intent.
- [ ] Confirm task/message/agent/depth/runtime limits fail closed when exceeded.

## Production invariants

1. The existing authenticated API boundary remains authoritative.
2. The deterministic intelligence orchestrator remains the traveler-facing source of truth for this milestone.
3. The collective may plan and coordinate only inside authorized capabilities.
4. Agent recruitment is restricted to the server-owned registry.
5. High-risk, confirmation-gated, write, and execute tools are non-autonomous.
6. The collective receives no shell access, raw credentials, unrestricted network primitive, or direct Firebase Admin authority.
7. One traveler request produces one final grounded/refined answer.

## Required evidence before worker execution

Before adding a model-backed `AgentWorker`, capture evidence for:

- capability-escalation rejection;
- dependency-cycle handling;
- prompt-injection attempts that request new tools or capabilities;
- malicious blackboard messages requesting hidden authority;
- worker timeout and retry behavior;
- duplicate task claim races;
- event-log redaction of traveler-sensitive content;
- confirmation preservation across booking and mobility handoffs;
- deterministic fallback when a worker or model is unavailable.

Do not enable model-driven tool execution until all of the above have explicit automated coverage.
