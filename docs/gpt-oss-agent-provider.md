# gpt-oss advisory agent provider

The bounded collective-agent runtime can use either OpenAI-hosted inference or a self/third-party-hosted `gpt-oss` model without changing the governance boundary.

The provider swap applies only to the advisory model worker. Capability authorization, payload minimization, delegation limits, the read-only tool broker, evidence handling, and fail-closed behavior remain server-controlled.

## Why this boundary exists

`gpt-oss-20b` and `gpt-oss-120b` are open-weight text reasoning models. They are not served by OpenAI's hosted API, but supported runtimes can expose an OpenAI-compatible Responses endpoint. Keeping the inference endpoint behind the existing `AgentWorker` interface lets USVI Explorer change model infrastructure without granting the model additional application authority.

## OpenAI-hosted provider

```bash
USVI_AGENT_WORKERS_SHADOW=1
USVI_AGENT_MODEL_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-sol
```

If `USVI_AGENT_MODEL_PROVIDER` is omitted, `openai` remains the default. If the API key is missing, the worker remains disabled.

## gpt-oss provider

Point the app at a Responses-compatible endpoint operated on infrastructure you trust:

```bash
USVI_AGENT_WORKERS_SHADOW=1
USVI_AGENT_MODEL_PROVIDER=gpt-oss
GPT_OSS_RESPONSES_URL=http://127.0.0.1:11434/v1/responses
GPT_OSS_MODEL=gpt-oss-20b
```

`GPT_OSS_API_KEY` is optional. Leave it unset for a trusted local endpoint. Set it when the inference service requires bearer authentication:

```bash
GPT_OSS_API_KEY=...
```

The model name must match the identifier exposed by the selected inference runtime. `gpt-oss-20b` is the application default when `GPT_OSS_MODEL` is omitted.

## Production topology

Do not attempt to load model weights inside a normal Vercel serverless function. The intended topology is:

```text
Next.js / Vercel
      |
      | HTTPS
      v
Responses-compatible inference service
      |
      +-- gpt-oss-20b (initial target)
      +-- gpt-oss-120b (later, when workload justifies it)
```

For a private network deployment, expose only the inference API needed by the application and protect it with network policy and/or bearer authentication. Do not expose an unrestricted model server directly to the public internet.

## Safety invariants

The provider does **not** receive raw Firebase user/session identifiers or the complete saved-memory object. `buildAgentWorkerPayload()` continues to send only the minimized traveler context required for the assigned task.

The model still cannot execute application tools. It can request one of the task's explicitly requestable read-only tools; the server-side broker independently authorizes and executes that request. High-risk tools and capability escalation remain unavailable to the model.

Unknown provider values fail closed by returning no configured advisory worker. A missing `GPT_OSS_RESPONSES_URL` also leaves the worker disabled rather than silently routing traffic to another provider.

## Verification

Run:

```bash
npx tsx scripts/test-agent-worker.ts
npx tsx scripts/test-gpt-oss-agent-provider.ts
npm run typecheck
```

The gpt-oss provider test verifies:

- explicit Responses endpoint routing;
- no synthetic Authorization header for local endpoints;
- bearer authentication for hosted endpoints when configured;
- preservation of payload minimization;
- provider selection from environment variables; and
- fail-closed handling for unknown providers.

## Next milestone

This change deliberately adds **provider selection**, not automatic multi-model routing. The next safe layer is an intelligence router that makes a bounded routing decision from task metadata (latency, privacy, modality, complexity, and cost) before choosing a provider. That router should remain separate from the social conversation state so human chat, group chat, and AI participants all use one conversation model regardless of which inference backend serves a particular turn.
