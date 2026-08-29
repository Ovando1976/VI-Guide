# Unified conversation engine

The conversation engine is the canonical application layer for human chat, group chat, community conversations, business chat, AI participants, and shared artifacts.

It deliberately does **not** use OpenAI, Anthropic, Gemini, or another provider's request/response DTOs as stored conversation state. Model providers are inference infrastructure; the application owns identity, membership, permissions, messages, artifacts, and AI-access policy.

## Canonical storage shape

The intended persistent layout is:

```text
conversations/{conversationId}
  participants/{participantId}
  messages/{messageId}
  artifacts/{artifactId}
```

Participants, messages, and artifacts should remain separate records/subcollections rather than unbounded arrays on the conversation document. A Firestore adapter can implement `ConversationStore` without changing the domain model.

## Conversation kinds

The first contract supports:

- `direct` — exactly two active human participants, with optional AI assistants;
- `group` — multi-human private/group chat;
- `community` — community-scoped discussion;
- `workspace` — collaborative project/chat surface;
- `business` — human/business messaging.

## Participant model

A participant is not the same thing as a provider model or a Firebase user record. It is a conversation-scoped actor with:

- `actorType`: `human`, `ai`, `business`, or `system`;
- a conversation-scoped participant id;
- an application actor id used only inside the trusted application layer;
- role (`owner`, `admin`, `member`, `assistant`);
- explicit read, write, and AI-invocation grants.

The AI-context builder emits the conversation-scoped participant id, not the external actor id. This prevents raw account identifiers from leaking into model requests by default.

## Message model

Messages are composed of provider-neutral parts:

- text;
- image/video/audio references;
- file references;
- locations;
- shared artifact references;
- polls;
- system events.

AI-generated messages may store operational metadata (`runId`, provider, model, route class) for observability. That metadata is intentionally stripped from the content sent back into future AI context. Private chain-of-thought is never part of the message contract.

## Authorization invariants

The engine fails closed when membership or authority is uncertain.

- a participant can send only as itself;
- only a system participant can emit system message parts;
- participants require active read/write grants to send;
- participants can edit only their own non-system messages;
- owners/admins may remove another participant's message, but deletion creates a tombstone rather than silently editing their text;
- deleted messages do not enter AI context;
- AI context requires an active participant with `canInvokeAi`;
- `ai.access=off` blocks model context entirely;
- `ai.access=mention` requires an actual triggering message that mentions the configured assistant;
- `ai.access=active` allows explicit active invocation;
- the selected assistant must be an active configured AI participant.

## Shared artifacts

Conversation artifacts are references, not embedded editor state. The initial artifact types are:

```text
document
plan
task_list
poll
map
event
other
```

This allows the same conversation to attach a collaborative document, trip plan, event, poll, or future workspace object while the owning feature remains responsible for its detailed data model and access controls.

## AI participant bridge

`ConversationAiParticipantBridge` connects the authorized conversation domain to an `AgentWorker`. In production that worker can be `IslandIntelligenceRouterWorker`, so the existing router still decides between configured OpenAI and gpt-oss workers.

The bridge deliberately does not bypass conversation policy:

1. `ConversationEngine.buildAiContext()` validates AI access plus mention/active invocation rules.
2. Only privacy-minimized conversation history is converted into bounded worker input.
3. External account ids and the client intelligence session id are stripped before model routing.
4. The direct reply bridge exposes no tool surface; `tool_request` and `delegate` outputs are rejected rather than executed.
5. The AI participant persists its own response through `ConversationEngine.appendMessage()`.
6. Router provider/model/complexity metadata is retained in `message.aiRun` for auditability but excluded from future model context.

This preserves the same authorization path for human and AI-authored messages while keeping model routing below the conversation layer.

## Persistence boundary

`ConversationStore` is intentionally storage-neutral. The first implementation, `InMemoryConversationStore`, exists for deterministic domain testing. A production Firestore adapter should preserve the same contract and add transactions/idempotency where required for concurrent message writes.

## Verification

Run:

```bash
npx tsx scripts/test-conversation-engine.ts
npx tsx scripts/test-conversation-ai-bridge.ts
npm run typecheck
```

The tests cover direct/group validation, sender impersonation denial, read-only participants, sender-only edits, moderator tombstone deletion, AI opt-in and mention enforcement, model-context minimization, deleted-message exclusion, shared artifact references, AI self-authorship, identity minimization, bounded capabilities, and rejection of direct tool execution.

## Next milestone

The next layer is the **Firestore conversation adapter plus authenticated API/realtime surface**. It should implement the existing `ConversationStore` contract, preserve fail-closed authorization, and avoid exposing unrestricted collection access to clients.
