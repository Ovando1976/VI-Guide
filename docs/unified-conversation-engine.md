# Unified conversation engine

The conversation engine is the canonical application layer for human chat, group chat, community conversations, business chat, AI participants, and shared artifacts.

It deliberately does **not** use OpenAI, Anthropic, Gemini, or another provider's request/response DTOs as stored conversation state. Model providers are inference infrastructure; the application owns identity, membership, permissions, messages, artifacts, and AI-access policy.

## Canonical storage shape

The persistent layout is:

```text
conversations/{conversationId}
  participants/{participantId}
  messages/{messageId}
  artifacts/{artifactId}
```

Participants, messages, and artifacts remain separate records/subcollections rather than unbounded arrays on the conversation document.

## Conversation invariants

- Direct chats require exactly two active human participants, with optional AI assistants.
- Private/group AI access defaults to `off`.
- `mention` mode requires a real triggering message authored by the requester and explicitly mentioning the configured assistant.
- Participants cannot send as another human, AI, or system participant.
- Message edits are sender-only.
- Owners/admins remove another participant's message via a tombstone rather than silently rewriting history.
- Deleted and system-only messages never enter AI context.
- Actor/account ids and prior AI provider/run metadata are excluded from AI context.
- Shared documents, plans, task lists, polls, maps, and events are referenced as artifacts rather than embedded into messages.

## AI participant bridge

`ConversationAiParticipantBridge` connects authorized conversation context to an `AgentWorker`. In production the worker can be `IslandIntelligenceRouterWorker`, allowing the existing router to choose between configured OpenAI and gpt-oss workers.

The bridge deliberately does not bypass conversation policy:

1. `ConversationEngine.buildAiContext()` validates AI access plus mention/active invocation rules.
2. Only privacy-minimized conversation history is converted into bounded worker input.
3. External account ids and the client intelligence session id are stripped before model routing.
4. The direct reply bridge exposes no tool surface; `tool_request` and `delegate` outputs are rejected rather than executed.
5. The AI participant persists its own response through `ConversationEngine.appendMessage()`.
6. Router provider/model/complexity metadata is retained in `message.aiRun` for auditability but excluded from future model context.

## Firestore persistence

`FirestoreConversationStore` implements `ConversationStore` on the server through Firebase Admin.

New message append is staged until the engine's conversation update arrives. The store then commits the message and `lastMessage` pointer in one Firestore transaction. Message ids are idempotent: an exact duplicate is accepted, while the same id with different content fails closed. Concurrent sends use a monotonic `(createdAt, messageId)` ordering so a delayed older transaction cannot move the conversation preview backward.

Existing message edits/deletions persist directly. Message pagination uses a message-id cursor and deterministic `createdAt + documentId` ordering.

## Authenticated APIs

The browser does not receive unrestricted Admin/Firestore access.

```text
GET  /api/conversations/{conversationId}/messages
POST /api/conversations/{conversationId}/messages
POST /api/conversations/{conversationId}/ai
```

Each server route verifies a Firebase bearer token and binds the verified Firebase uid to an active human participant before reading or writing conversation data. The client never supplies `senderParticipantId`; sender identity is derived on the server.

The public message response strips internal `aiRun` provider/model metadata.

The AI endpoint additionally verifies the configured assistant participant and conversation AI-access mode before invoking the conversation bridge. Conversation AI uses `USVI_CHAT_MODEL_PROVIDER` (falling back to the general model-provider setting) and can select OpenAI, gpt-oss, or the Island router. `USVI_CHAT_AI_ENABLED=0` hard-disables the endpoint.

## Client boundary

`ConversationClient` provides authenticated load/send/AI-invoke calls. It accepts a Firebase token provider rather than importing Firestore into chat UI components.

## Verification

Focused contracts include:

```bash
npx tsx scripts/test-conversation-engine.ts
npx tsx scripts/test-conversation-ai-bridge.ts
npx tsx scripts/test-firestore-conversation-store.ts
npm run typecheck
```

The Firestore store test uses an in-memory Firestore-compatible harness and does not touch live data. It covers staged append, atomic message/preview commit, monotonic concurrent ordering, direct edits, and duplicate-id conflict rejection.

## Next milestone

Add authenticated realtime delivery (server-owned stream or equally restricted transport), then build the first visible social chat surface on top of `ConversationClient`: thread list, message timeline, composer, reply state, mention-to-AI flow, and loading/error states.
