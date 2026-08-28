# Agent shadow canary

This milestone provides a controlled path for exercising the bounded advisory worker and deterministic read-only broker with real model calls without affecting traveler-facing decisions.

## Authority boundary

The canary remains advisory and shadow-only. The deterministic intelligence orchestrator continues to own the traveler-facing answer, plan, recommendations, mobility handoffs, booking review, confirmations, memory persistence, and financial behavior. The model receives no callable tools. A model may request one approved read-only broker lookup, which is independently authorized and executed by server code.

Production is categorically denied by `evaluateAgentShadowCanary()`. Enabling environment flags in a Vercel production deployment is insufficient to start the canary. A future production-shadow promotion must intentionally change that code and pass a separate review.

## Activation requirements

A request is selected only when all of these are true:

1. The runtime environment is Vercel Preview or local development.
2. `USVI_AGENT_SHADOW_CANARY=1`.
3. `USVI_AGENT_WORKERS_SHADOW=1`.
4. `USVI_AGENT_TOOL_BROKER_SHADOW=1`.
5. `OPENAI_API_KEY` is configured.
6. The request has a session ID.
7. The session is selected either by the deterministic sample rate or by an explicit SHA-256 session hash allowlist.

`USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS` is expressed in basis points from `0` to `10000`. The default is `0`, so merely enabling the flags does not create model traffic. `USVI_AGENT_SHADOW_CANARY_SESSION_HASHES` accepts comma-separated full SHA-256 hashes; raw session IDs must never be stored in environment configuration.

## Cost and execution ceilings

The canary permits one worker task per selected request. The existing worker runtime still enforces its global model-call ceiling. A normal canary task therefore uses one model call, or at most two when the worker requests an approved read-only lookup and receives a bounded follow-up assessment.

The read-only broker remains limited to its reviewed local adapters, timeout, query, result-count, provenance, capability, task, agent, confirmation, and permission policies.

## Telemetry

Internal intelligence events record only the canary decision fields needed to evaluate rollout quality: selected state, decision reason, environment, sampling rate, sample bucket, explicit-cohort boolean, and task ceiling. The canary telemetry does not persist the raw session ID or its SHA-256 hash.

Existing worker telemetry remains privacy-minimized and broker audits continue to use hashed query/root correlation rather than traveler text, prompts, responses, credentials, or evidence bodies.

## Promotion gate

Do not promote beyond preview canary until the collected evidence shows stable latency and failure rates, no capability escalation, no unexpected broker denials, no traveler-facing regression, bounded token/call usage, and clean deterministic fallback behavior. Production remains off until a separate explicit code review removes the production deny.
