export type ConversationKind =
  | "direct"
  | "group"
  | "community"
  | "workspace"
  | "business";

export type ConversationActorType = "human" | "ai" | "business" | "system";

export type ConversationParticipantRole =
  | "owner"
  | "admin"
  | "member"
  | "assistant";

export type ConversationVisibility =
  | "private"
  | "members"
  | "community"
  | "public";

export type ConversationAiAccessMode = "off" | "mention" | "active";

export type Conversation = Readonly<{
  version: 1;
  id: string;
  kind: ConversationKind;
  title?: string;
  createdByParticipantId: string;
  visibility: ConversationVisibility;
  ai: Readonly<{
    access: ConversationAiAccessMode;
    assistantParticipantIds: readonly string[];
  }>;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Readonly<{
    id: string;
    senderParticipantId: string;
    createdAt: string;
    preview: string;
  }>;
}>;

export type ConversationParticipant = Readonly<{
  id: string;
  conversationId: string;
  actorType: ConversationActorType;
  actorId: string;
  role: ConversationParticipantRole;
  joinedAt: string;
  leftAt?: string | null;
  canRead: boolean;
  canWrite: boolean;
  canInvokeAi: boolean;
}>;

export type ConversationTextPart = Readonly<{
  type: "text";
  text: string;
}>;

export type ConversationMediaPart = Readonly<{
  type: "image" | "video" | "audio";
  mediaId: string;
  url?: string;
  mimeType?: string;
  alt?: string;
}>;

export type ConversationFilePart = Readonly<{
  type: "file";
  fileId: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
}>;

export type ConversationLocationPart = Readonly<{
  type: "location";
  name: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}>;

export type ConversationArtifactPart = Readonly<{
  type: "artifact";
  artifactId: string;
  artifactType:
    | "document"
    | "plan"
    | "task_list"
    | "poll"
    | "map"
    | "event"
    | "other";
  title: string;
}>;

export type ConversationPollPart = Readonly<{
  type: "poll";
  pollId: string;
  question: string;
  optionIds: readonly string[];
}>;

export type ConversationSystemPart = Readonly<{
  type: "system";
  event:
    | "participant_joined"
    | "participant_left"
    | "title_changed"
    | "ai_access_changed"
    | "message_removed"
    | "other";
  text: string;
}>;

export type ConversationMessagePart =
  | ConversationTextPart
  | ConversationMediaPart
  | ConversationFilePart
  | ConversationLocationPart
  | ConversationArtifactPart
  | ConversationPollPart
  | ConversationSystemPart;

export type ConversationMessage = Readonly<{
  version: 1;
  id: string;
  conversationId: string;
  senderParticipantId: string;
  parts: readonly ConversationMessagePart[];
  replyToMessageId?: string;
  mentions?: readonly string[];
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  deletedByParticipantId?: string | null;
  aiRun?: Readonly<{
    runId: string;
    provider?: string;
    model?: string;
    routeClass?: string;
  }>;
}>;

export type ConversationArtifact = Readonly<{
  version: 1;
  id: string;
  conversationId: string;
  type:
    | "document"
    | "plan"
    | "task_list"
    | "poll"
    | "map"
    | "event"
    | "other";
  title: string;
  createdByParticipantId: string;
  createdAt: string;
  updatedAt: string;
  referenceId?: string;
  referenceHref?: string;
}>;

export type ConversationAiContextPart = Exclude<
  ConversationMessagePart,
  ConversationSystemPart
>;

export type ConversationAiContextMessage = Readonly<{
  messageId: string;
  speakerParticipantId: string;
  speakerType: Exclude<ConversationActorType, "system">;
  role: "user" | "assistant";
  parts: readonly ConversationAiContextPart[];
  createdAt: string;
}>;

export type ConversationAiContext = Readonly<{
  conversationId: string;
  conversationKind: ConversationKind;
  invocation: "mention" | "active";
  assistantParticipantId: string;
  messages: readonly ConversationAiContextMessage[];
}>;
