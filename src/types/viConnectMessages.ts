import type { VIConnectProfile } from "./viConnect";

export type VIConnectMessageKind =
  | "text"
  | "date_plan"
  | "place"
  | "ride_plan"
  | "system";

export type VIConnectConversationStatus =
  | "active"
  | "archived"
  | "blocked";

export type VIConnectConversation = {
  id: string;
  profileId: string;
  profileDisplayName: string;
  profileImageUrl: string;
  participantUids: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastMessageText?: string;
  unreadCount?: number;
  status: VIConnectConversationStatus;
};

export type VIConnectMessage = {
  id: string;
  conversationId: string;
  senderUid: string;
  senderLabel: "me" | "match" | "system";
  text: string;
  kind: VIConnectMessageKind;
  metadata?: {
    profileId?: string;
    placeName?: string;
    placePath?: string;
    dateIdeaTitle?: string;
    ridePath?: string;
    mapPath?: string;
  };
  createdAt: string;
  readBy: string[];
};

export type VIConnectConversationBundle = {
  conversation: VIConnectConversation;
  profile: VIConnectProfile | null;
  messages: VIConnectMessage[];
};
