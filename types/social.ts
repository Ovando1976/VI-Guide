export type SocialIsland =
  | "stt"
  | "stj"
  | "stx"
  | "water_island"
  | "diaspora"
  | "visitor";

export type SocialAccountType =
  | "personal"
  | "creator"
  | "business"
  | "organization"
  | "government";

export type SocialPrivacyMode = "public" | "private";
export type SocialAccountState = "active" | "restricted" | "suspended" | "deleted";
export type SocialVerificationType =
  | "identity"
  | "business"
  | "organization"
  | "government"
  | "creator";

export interface SocialProfile {
  version: 1;
  userId: string;
  handle: string;
  handleLower: string;
  displayName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string;
  primaryIsland: SocialIsland;
  neighborhood: string | null;
  hometown: string | null;
  interests: readonly string[];
  profession: string | null;
  website: string | null;
  accountType: SocialAccountType;
  privacyMode: SocialPrivacyMode;
  state: SocialAccountState;
  verification: readonly SocialVerificationType[];
  followerCount: number;
  followingCount: number;
  postCount: number;
  searchPrefixes: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export type PublicSocialProfile = Omit<SocialProfile, "searchPrefixes">;

export type SocialFollowStatus = "pending" | "accepted" | "declined" | "removed";

export interface SocialFollow {
  version: 1;
  id: string;
  followerId: string;
  targetId: string;
  status: SocialFollowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SocialBlock {
  version: 1;
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface SocialMute {
  version: 1;
  id: string;
  muterId: string;
  mutedId: string;
  createdAt: string;
}

export type SocialPostType =
  | "text"
  | "photo"
  | "video"
  | "poll"
  | "event"
  | "shared_place"
  | "business"
  | "community";

export type SocialPostVisibility = "public" | "followers" | "community" | "private";

export interface SocialMediaReference {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
}

export interface SocialPlaceReference {
  id: string;
  name: string;
  island?: SocialIsland | null;
  href?: string | null;
}

export interface SocialPost {
  version: 1;
  id: string;
  authorId: string;
  type: SocialPostType;
  body: string;
  media: readonly SocialMediaReference[];
  visibility: SocialPostVisibility;
  island: SocialIsland | null;
  communityId: string | null;
  place: SocialPlaceReference | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface SocialPostView extends SocialPost {
  author: PublicSocialProfile;
  viewerReaction: string | null;
  viewerSaved: boolean;
}

export interface SocialComment {
  version: 1;
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  body: string;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

export interface SocialReaction {
  version: 1;
  id: string;
  actorId: string;
  targetType: "post" | "comment";
  targetId: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialSavedItem {
  version: 1;
  id: string;
  userId: string;
  itemType: "post" | "event" | "place" | "business";
  itemId: string;
  createdAt: string;
}

export type SocialCommunityVisibility = "public" | "private" | "invite_only";
export type SocialCommunityRole = "owner" | "admin" | "moderator" | "member";

export interface SocialCommunity {
  version: 1;
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  coverImageUrl: string | null;
  island: SocialIsland | null;
  category: string;
  visibility: SocialCommunityVisibility;
  ownerId: string;
  memberCount: number;
  postCount: number;
  conversationId: string | null;
  seeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialCommunityMembership {
  version: 1;
  id: string;
  communityId: string;
  userId: string;
  role: SocialCommunityRole;
  status: "active" | "pending" | "removed";
  joinedAt: string;
  updatedAt: string;
}

export type SocialNotificationType =
  | "message"
  | "mention"
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "comment"
  | "reply"
  | "reaction"
  | "community"
  | "event"
  | "business"
  | "ai";

export interface SocialNotification {
  version: 1;
  id: string;
  userId: string;
  type: SocialNotificationType;
  actorId: string | null;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export type SocialReportTargetType = "user" | "post" | "message" | "community" | "comment";
export type SocialReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "sexual"
  | "fraud"
  | "impersonation"
  | "privacy"
  | "other";

export interface SocialReport {
  version: 1;
  id: string;
  reporterId: string;
  targetType: SocialReportTargetType;
  targetId: string;
  reason: SocialReportReason;
  details: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

export type SocialMessageRequestState =
  | "none"
  | "incoming"
  | "outgoing"
  | "accepted"
  | "declined";

export interface SocialConversationInboxItem {
  version: 1;
  conversationId: string;
  userId: string;
  kind: "direct" | "group" | "community" | "business" | "ai_private";
  title: string;
  imageUrl: string | null;
  peerUserIds: readonly string[];
  requestState: SocialMessageRequestState;
  lastMessageId: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastReadMessageId: string | null;
  unreadCount: number;
  pinnedAt: string | null;
  mutedUntil: string | null;
  archivedAt: string | null;
  updatedAt: string;
}

export interface SocialFeedPage {
  posts: readonly SocialPostView[];
  nextCursor: string | null;
}
