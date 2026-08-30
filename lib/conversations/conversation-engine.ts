import { randomUUID } from "node:crypto";

import type { ConversationStore } from "@/lib/conversations/conversation-store";
import {
  assertCanDeleteMessage,
  assertCanEditMessage,
  assertCanInvokeAi,
  assertCanRead,
  assertCanWrite,
  assertConversationShape,
  assertMessageParts,
  ConversationPolicyError,
  isActiveParticipant,
} from "@/lib/conversations/conversation-policy";
import type {
  Conversation,
  ConversationActorType,
  ConversationAiAccessMode,
  ConversationAiContext,
  ConversationArtifact,
  ConversationArtifactPart,
  ConversationKind,
  ConversationMessage,
  ConversationMessagePart,
  ConversationParticipant,
  ConversationParticipantRole,
  ConversationVisibility,
} from "@/types/conversation";

type IdFactory = () => string;
type NowFactory = () => string;

export type ConversationParticipantSeed = Readonly<{
  id?: string;
  actorType: ConversationActorType;
  actorId: string;
  role?: ConversationParticipantRole;
  canRead?: boolean;
  canWrite?: boolean;
  canInvokeAi?: boolean;
}>;

export type CreateConversationInput = Readonly<{
  id?: string;
  kind: ConversationKind;
  title?: string;
  visibility?: ConversationVisibility;
  aiAccess?: ConversationAiAccessMode;
  createdByParticipantId: string;
  participants: readonly ConversationParticipantSeed[];
}>;

export type AppendConversationMessageInput = Readonly<{
  conversationId: string;
  actorParticipantId: string;
  senderParticipantId?: string;
  id?: string;
  parts: readonly ConversationMessagePart[];
  replyToMessageId?: string;
  mentions?: readonly string[];
  aiRun?: ConversationMessage["aiRun"];
}>;

export type EditConversationMessageInput = Readonly<{
  conversationId: string;
  actorParticipantId: string;
  messageId: string;
  parts: readonly ConversationMessagePart[];
}>;

export type DeleteConversationMessageInput = Readonly<{
  conversationId: string;
  actorParticipantId: string;
  messageId: string;
}>;

export type CreateConversationArtifactInput = Readonly<{
  conversationId: string;
  actorParticipantId: string;
  id?: string;
  type: ConversationArtifact["type"];
  title: string;
  referenceId?: string;
  referenceHref?: string;
}>;

export type BuildConversationAiContextInput = Readonly<{
  conversationId: string;
  requesterParticipantId: string;
  assistantParticipantId: string;
  invocation: "mention" | "active";
  invocationMessageId?: string;
  limit?: number;
}>;

function defaultVisibility(kind: ConversationKind): ConversationVisibility {
  return kind === "community" ? "members" : "private";
}

function cleanOptionalText(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function buildPreview(parts: readonly ConversationMessagePart[]) {
  for (const part of parts) {
    if (part.type === "text") return part.text.replace(/\s+/g, " ").trim().slice(0, 160);
    if (part.type === "artifact") return `Shared ${part.artifactType}: ${part.title}`.slice(0, 160);
    if (part.type === "file") return `Shared file: ${part.name}`.slice(0, 160);
    if (part.type === "image") return "Shared an image";
    if (part.type === "video") return "Shared a video";
    if (part.type === "audio") return "Shared audio";
    if (part.type === "location") return `Shared location: ${part.name}`.slice(0, 160);
    if (part.type === "poll") return `Poll: ${part.question}`.slice(0, 160);
    if (part.type === "system") return part.text.replace(/\s+/g, " ").trim().slice(0, 160);
  }
  return "New message";
}

export class ConversationEngine {
  private readonly store: ConversationStore;
  private readonly createId: IdFactory;
  private readonly now: NowFactory;

  constructor(
    store: ConversationStore,
    options: Readonly<{ createId?: IdFactory; now?: NowFactory }> = {},
  ) {
    this.store = store;
    this.createId = options.createId ?? randomUUID;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async createConversation(input: CreateConversationInput) {
    const id = cleanOptionalText(input.id, 160) ?? this.createId();
    const createdAt = this.now();
    const seenParticipantIds = new Set<string>();

    const participants = input.participants.map((seed) => {
      const participantId = cleanOptionalText(seed.id, 160) ?? this.createId();
      if (seenParticipantIds.has(participantId)) {
        throw new ConversationPolicyError(
          "invalid_conversation",
          "Conversation participant ids must be unique.",
        );
      }
      seenParticipantIds.add(participantId);
      if (!seed.actorId.trim()) {
        throw new ConversationPolicyError(
          "invalid_conversation",
          "Conversation participant actor id is required.",
        );
      }
      const role =
        participantId === input.createdByParticipantId
          ? "owner"
          : seed.role ?? (seed.actorType === "ai" ? "assistant" : "member");
      return Object.freeze({
        id: participantId,
        conversationId: id,
        actorType: seed.actorType,
        actorId: seed.actorId.trim().slice(0, 240),
        role,
        joinedAt: createdAt,
        leftAt: null,
        canRead: seed.canRead ?? true,
        canWrite: seed.canWrite ?? true,
        canInvokeAi: seed.canInvokeAi ?? seed.actorType !== "ai",
      }) satisfies ConversationParticipant;
    });

    const assistantParticipantIds = participants
      .filter(
        (participant) =>
          participant.actorType === "ai" && participant.role === "assistant",
      )
      .map((participant) => participant.id);

    const conversation = Object.freeze({
      version: 1 as const,
      id,
      kind: input.kind,
      title: cleanOptionalText(input.title, 160),
      createdByParticipantId: input.createdByParticipantId,
      visibility: input.visibility ?? defaultVisibility(input.kind),
      ai: Object.freeze({
        access: input.aiAccess ?? "off",
        assistantParticipantIds: Object.freeze(assistantParticipantIds),
      }),
      createdAt,
      updatedAt: createdAt,
    }) satisfies Conversation;

    assertConversationShape(conversation, participants);

    await this.store.putConversation(conversation);
    for (const participant of participants) {
      await this.store.putParticipant(participant);
    }
    return conversation;
  }

  async appendMessage(input: AppendConversationMessageInput) {
    const conversation = await this.requireConversation(input.conversationId);
    const actor = await this.requireParticipant(
      input.conversationId,
      input.actorParticipantId,
    );
    assertCanWrite(actor);

    const senderParticipantId = input.senderParticipantId ?? input.actorParticipantId;
    if (senderParticipantId !== input.actorParticipantId) {
      throw new ConversationPolicyError(
        "impersonation_denied",
        "A participant cannot send a message as another participant.",
      );
    }

    const sender = await this.requireParticipant(
      input.conversationId,
      senderParticipantId,
    );
    assertCanWrite(sender);
    assertMessageParts(input.parts);

    if (
      input.parts.some((part) => part.type === "system") &&
      sender.actorType !== "system"
    ) {
      throw new ConversationPolicyError(
        "impersonation_denied",
        "Only a system participant can append system message parts.",
      );
    }

    if (input.replyToMessageId) {
      await this.requireMessage(input.conversationId, input.replyToMessageId);
    }

    const createdAt = this.now();
    const message = Object.freeze({
      version: 1 as const,
      id: cleanOptionalText(input.id, 160) ?? this.createId(),
      conversationId: conversation.id,
      senderParticipantId,
      parts: Object.freeze([...input.parts]),
      replyToMessageId: cleanOptionalText(input.replyToMessageId, 160),
      mentions: input.mentions
        ? Object.freeze(Array.from(new Set(input.mentions.map((id) => id.trim()).filter(Boolean))).slice(0, 50))
        : undefined,
      createdAt,
      editedAt: null,
      deletedAt: null,
      deletedByParticipantId: null,
      aiRun: input.aiRun,
    }) satisfies ConversationMessage;

    await this.store.putMessage(message);
    await this.store.putConversation(
      Object.freeze({
        ...conversation,
        updatedAt: createdAt,
        lastMessage: Object.freeze({
          id: message.id,
          senderParticipantId,
          createdAt,
          preview: buildPreview(message.parts),
        }),
      }),
    );
    return message;
  }

  async editMessage(input: EditConversationMessageInput) {
    await this.requireConversation(input.conversationId);
    const actor = await this.requireParticipant(
      input.conversationId,
      input.actorParticipantId,
    );
    const message = await this.requireMessage(input.conversationId, input.messageId);
    assertCanEditMessage(actor, message);
    assertMessageParts(input.parts);
    if (input.parts.some((part) => part.type === "system")) {
      throw new ConversationPolicyError(
        "message_edit_denied",
        "Participant edits cannot turn a message into a system event.",
      );
    }

    const updated = Object.freeze({
      ...message,
      parts: Object.freeze([...input.parts]),
      editedAt: this.now(),
    }) satisfies ConversationMessage;
    await this.store.putMessage(updated);
    return updated;
  }

  async deleteMessage(input: DeleteConversationMessageInput) {
    await this.requireConversation(input.conversationId);
    const actor = await this.requireParticipant(
      input.conversationId,
      input.actorParticipantId,
    );
    const message = await this.requireMessage(input.conversationId, input.messageId);
    assertCanDeleteMessage(actor, message);
    if (message.deletedAt) return message;

    const deletedAt = this.now();
    const deleted = Object.freeze({
      ...message,
      parts: Object.freeze([
        Object.freeze({
          type: "system" as const,
          event: "message_removed" as const,
          text: "Message removed.",
        }),
      ]),
      editedAt: message.editedAt ?? null,
      deletedAt,
      deletedByParticipantId: actor.id,
      aiRun: undefined,
    }) satisfies ConversationMessage;
    await this.store.putMessage(deleted);
    return deleted;
  }

  async createArtifact(input: CreateConversationArtifactInput) {
    const conversation = await this.requireConversation(input.conversationId);
    const actor = await this.requireParticipant(
      input.conversationId,
      input.actorParticipantId,
    );
    assertCanWrite(actor);
    const title = input.title.trim();
    if (!title) {
      throw new ConversationPolicyError(
        "invalid_message",
        "Conversation artifact title is required.",
      );
    }

    const createdAt = this.now();
    const artifact = Object.freeze({
      version: 1 as const,
      id: cleanOptionalText(input.id, 160) ?? this.createId(),
      conversationId: conversation.id,
      type: input.type,
      title: title.slice(0, 240),
      createdByParticipantId: actor.id,
      createdAt,
      updatedAt: createdAt,
      referenceId: cleanOptionalText(input.referenceId, 240),
      referenceHref: cleanOptionalText(input.referenceHref, 2_000),
    }) satisfies ConversationArtifact;
    await this.store.putArtifact(artifact);
    return artifact;
  }

  artifactPart(artifact: ConversationArtifact): ConversationArtifactPart {
    return Object.freeze({
      type: "artifact",
      artifactId: artifact.id,
      artifactType: artifact.type,
      title: artifact.title,
    });
  }

  async buildAiContext(
    input: BuildConversationAiContextInput,
  ): Promise<ConversationAiContext> {
    const conversation = await this.requireConversation(input.conversationId);
    if (conversation.ai.access === "off") {
      throw new ConversationPolicyError(
        "ai_disabled",
        "AI access is disabled for this conversation.",
      );
    }

    const requester = await this.requireParticipant(
      input.conversationId,
      input.requesterParticipantId,
    );
    assertCanInvokeAi(requester);

    if (!conversation.ai.assistantParticipantIds.includes(input.assistantParticipantId)) {
      throw new ConversationPolicyError(
        "assistant_not_found",
        "The requested AI assistant is not enabled for this conversation.",
      );
    }
    const assistant = await this.requireParticipant(
      input.conversationId,
      input.assistantParticipantId,
    );
    assertCanRead(assistant);
    if (assistant.actorType !== "ai" || assistant.role !== "assistant") {
      throw new ConversationPolicyError(
        "assistant_invalid",
        "The requested participant is not a valid AI assistant.",
      );
    }

    if (conversation.ai.access === "mention" && input.invocation !== "mention") {
      throw new ConversationPolicyError(
        "ai_invocation_denied",
        "This conversation allows AI only when the assistant is explicitly mentioned.",
      );
    }

    if (input.invocation === "mention") {
      if (!input.invocationMessageId) {
        throw new ConversationPolicyError(
          "ai_invocation_denied",
          "Mention invocation requires the triggering message id.",
        );
      }
      const invocationMessage = await this.requireMessage(
        input.conversationId,
        input.invocationMessageId,
      );
      if (
        invocationMessage.deletedAt ||
        invocationMessage.senderParticipantId !== requester.id ||
        !invocationMessage.mentions?.includes(assistant.id)
      ) {
        throw new ConversationPolicyError(
          "ai_invocation_denied",
          "The triggering message must explicitly mention the selected assistant.",
        );
      }
    }

    const limit = Math.max(1, Math.min(input.limit ?? 40, 100));
    const participants = await this.store.listParticipants(input.conversationId);
    const participantById = new Map(
      participants.map((participant) => [participant.id, participant] as const),
    );
    const messages = await this.store.listMessages(input.conversationId, { limit });

    const safeMessages = messages.flatMap((message) => {
      if (message.deletedAt) return [];
      const speaker = participantById.get(message.senderParticipantId);
      if (!speaker || !isActiveParticipant(speaker) || speaker.actorType === "system") {
        return [];
      }
      const parts = message.parts.filter(
        (part): part is Exclude<ConversationMessagePart, { type: "system" }> =>
          part.type !== "system",
      );
      if (!parts.length) return [];
      return [
        Object.freeze({
          messageId: message.id,
          speakerParticipantId: speaker.id,
          speakerType: speaker.actorType,
          role: speaker.actorType === "ai" ? ("assistant" as const) : ("user" as const),
          parts: Object.freeze(parts),
          createdAt: message.createdAt,
        }),
      ];
    });

    return Object.freeze({
      conversationId: conversation.id,
      conversationKind: conversation.kind,
      invocation: input.invocation,
      assistantParticipantId: assistant.id,
      messages: Object.freeze(safeMessages),
    });
  }

  private async requireConversation(id: string) {
    const conversation = await this.store.getConversation(id);
    if (!conversation) {
      throw new ConversationPolicyError(
        "conversation_not_found",
        "Conversation was not found.",
      );
    }
    return conversation;
  }

  private async requireParticipant(conversationId: string, participantId: string) {
    const participant = await this.store.getParticipant(conversationId, participantId);
    if (!participant) {
      throw new ConversationPolicyError(
        "participant_not_found",
        "Conversation participant was not found.",
      );
    }
    return participant;
  }

  private async requireMessage(conversationId: string, messageId: string) {
    const message = await this.store.getMessage(conversationId, messageId);
    if (!message) {
      throw new ConversationPolicyError(
        "message_not_found",
        "Conversation message was not found.",
      );
    }
    return message;
  }
}
