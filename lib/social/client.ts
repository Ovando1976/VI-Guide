"use client";

import type {
  PublicSocialProfile,
  SocialComment,
  SocialCommunity,
  SocialCommunityMembership,
  SocialConversationInboxItem,
  SocialFeedPage,
  SocialFollow,
  SocialNotification,
  SocialPostView,
} from "@/types/social";

export type SocialTokenProvider = () => Promise<string | null>;

async function apiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return new Error(typeof payload?.error === "string" ? payload.error : `Social request failed with ${response.status}.`);
}

export class SocialClient {
  constructor(private readonly getToken: SocialTokenProvider) {}

  private async headers(auth = true) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const token = await this.getToken();
      if (!token) throw new Error("Sign in to use social features.");
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
    const response = await fetch(path, {
      ...init,
      headers: { ...(await this.headers(auth)), ...(init.headers ?? {}) },
      cache: "no-store",
    });
    if (!response.ok) throw await apiError(response);
    return (await response.json()) as T;
  }

  async myProfile() {
    return (await this.request<{ profile: PublicSocialProfile }>("/api/social/profile")).profile;
  }

  async updateProfile(input: Record<string, unknown>) {
    return (
      await this.request<{ profile: PublicSocialProfile }>("/api/social/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    ).profile;
  }

  async profileByHandle(handle: string) {
    return (
      await this.request<{ profile: PublicSocialProfile }>(
        `/api/social/profile?handle=${encodeURIComponent(handle)}`,
        {},
        false,
      )
    ).profile;
  }

  async searchPeople(query = "", limit = 24) {
    return (
      await this.request<{ profiles: PublicSocialProfile[] }>(
        `/api/social/people?q=${encodeURIComponent(query)}&limit=${limit}`,
        {},
        false,
      )
    ).profiles;
  }

  async relationship(userId: string) {
    return (
      await this.request<{ relationship: { outgoing: SocialFollow | null; incoming: SocialFollow | null; blocked: boolean; blockedBy: boolean } }>(
        `/api/social/follows?userId=${encodeURIComponent(userId)}`,
      )
    ).relationship;
  }

  async follow(targetUserId: string) {
    return (
      await this.request<{ follow: SocialFollow }>("/api/social/follows", {
        method: "POST",
        body: JSON.stringify({ targetUserId }),
      })
    ).follow;
  }

  async unfollow(targetUserId: string) {
    await this.request("/api/social/follows", { method: "DELETE", body: JSON.stringify({ targetUserId }) });
  }

  async respondToFollow(followerId: string, action: "accept" | "decline") {
    await this.request("/api/social/follows", {
      method: "POST",
      body: JSON.stringify({ targetUserId: followerId, action }),
    });
  }

  async block(targetUserId: string) {
    await this.request("/api/social/blocks", { method: "POST", body: JSON.stringify({ targetUserId }) });
  }

  async unblock(targetUserId: string) {
    await this.request("/api/social/blocks", { method: "DELETE", body: JSON.stringify({ targetUserId }) });
  }

  async mute(targetUserId: string) {
    await this.request("/api/social/blocks", { method: "POST", body: JSON.stringify({ targetUserId, action: "mute" }) });
  }

  async inbox(limit = 80) {
    return (
      await this.request<{ conversations: SocialConversationInboxItem[] }>(`/api/social/conversations/inbox?limit=${limit}`)
    ).conversations;
  }

  async startDirect(targetUserId: string) {
    return this.request<{
      conversationId: string;
      participantId: string;
      peer: PublicSocialProfile;
      aiAccess: "off" | "mention" | "active";
    }>(
      "/api/social/conversations/direct",
      { method: "POST", body: JSON.stringify({ targetUserId }) },
    );
  }

  async createGroup(title: string, memberIds: readonly string[]) {
    return this.request<{ conversationId: string; participantId: string; assistantParticipantId: string }>(
      "/api/social/conversations/groups",
      { method: "POST", body: JSON.stringify({ title, memberIds }) },
    );
  }

  async markConversationRead(conversationId: string, messageId?: string | null) {
    await this.request("/api/social/conversations/inbox", {
      method: "PATCH",
      body: JSON.stringify({ conversationId, messageId: messageId ?? null }),
    });
  }

  async feed(mode: "following" | "local" | "for_you" = "for_you", limit = 20) {
    return this.request<SocialFeedPage>(`/api/social/feed?mode=${mode}&limit=${limit}`);
  }

  async createPost(input: Record<string, unknown>) {
    return (
      await this.request<{ post: SocialPostView }>("/api/social/posts", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).post;
  }

  async post(postId: string) {
    return (
      await this.request<{ post: SocialPostView }>(`/api/social/posts/${encodeURIComponent(postId)}`, {}, false)
    ).post;
  }

  async comments(postId: string) {
    return (
      await this.request<{ comments: SocialComment[] }>(`/api/social/posts/${encodeURIComponent(postId)}/comments`, {}, false)
    ).comments;
  }

  async comment(postId: string, body: string, parentCommentId?: string) {
    return (
      await this.request<{ comment: SocialComment }>(`/api/social/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, ...(parentCommentId ? { parentCommentId } : {}) }),
      })
    ).comment;
  }

  async react(targetType: "post" | "comment", targetId: string, emoji: string) {
    await this.request("/api/social/reactions", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, emoji }),
    });
  }

  async unreact(targetType: "post" | "comment", targetId: string) {
    await this.request("/api/social/reactions", {
      method: "DELETE",
      body: JSON.stringify({ targetType, targetId }),
    });
  }

  async savePost(postId: string, saved = true) {
    await this.request("/api/social/saved", {
      method: "POST",
      body: JSON.stringify({ postId, saved }),
    });
  }

  async communities(query = "") {
    return (
      await this.request<{ communities: SocialCommunity[] }>(
        `/api/social/communities?q=${encodeURIComponent(query)}`,
        {},
        false,
      )
    ).communities;
  }

  async createCommunity(input: Record<string, unknown>) {
    return (
      await this.request<{ community: SocialCommunity }>("/api/social/communities", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ).community;
  }

  async joinCommunity(communityId: string) {
    return (
      await this.request<{ membership: SocialCommunityMembership }>(
        `/api/social/communities/${encodeURIComponent(communityId)}/membership`,
        { method: "POST", body: "{}" },
      )
    ).membership;
  }

  async leaveCommunity(communityId: string) {
    await this.request(`/api/social/communities/${encodeURIComponent(communityId)}/membership`, { method: "DELETE" });
  }

  async notifications(limit = 60) {
    return this.request<{ notifications: SocialNotification[]; unreadCount: number }>(
      `/api/social/notifications?limit=${limit}`,
    );
  }

  async readNotification(notificationId: string) {
    await this.request("/api/social/notifications", {
      method: "PATCH",
      body: JSON.stringify({ notificationId }),
    });
  }

  async report(input: { targetType: string; targetId: string; reason: string; details?: string }) {
    await this.request("/api/social/reports", { method: "POST", body: JSON.stringify(input) });
  }
}
