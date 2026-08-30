import type { NextRequest } from "next/server";

import { FirestoreConversationStore } from "@/lib/conversations/firestore-conversation-store";
import { bindConversationParticipant, verifiedConversationUserId } from "@/lib/conversations/server-auth";
import { getSocialProfile, publicSocialProfile } from "@/lib/social/profile-service";
import { socialErrorResponse, socialJson } from "@/lib/social/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type RouteContext = { params: { conversationId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const userId = await verifiedConversationUserId(request);
    const store = new FirestoreConversationStore();
    const self = await bindConversationParticipant(store, params.conversationId, userId);
    const conversation = await store.getConversation(params.conversationId);
    if (!conversation) return socialJson({ error: "Conversation was not found." }, { status: 404 });
    const participants = await store.listParticipants(params.conversationId);
    const publicParticipants = await Promise.all(
      participants.filter((participant) => !participant.leftAt).map(async (participant) => {
        const profile = participant.actorType === "human" ? await getSocialProfile(participant.actorId) : null;
        return {
          id: participant.id,
          actorType: participant.actorType,
          role: participant.role,
          isSelf: participant.id === self.id,
          canWrite: participant.canWrite,
          canInvokeAi: participant.canInvokeAi,
          profile: profile ? publicSocialProfile(profile) : null,
          label: participant.actorType === "ai" ? "Island AI" : participant.actorType === "system" ? "System" : profile?.displayName ?? "Island member",
        };
      }),
    );
    return socialJson({
      conversation: {
        id: conversation.id,
        kind: conversation.kind,
        title: conversation.title ?? null,
        visibility: conversation.visibility,
        aiAccess: conversation.ai.access,
        assistantParticipantIds: conversation.ai.assistantParticipantIds,
      },
      selfParticipantId: self.id,
      participants: publicParticipants,
    });
  } catch (error) {
    return socialErrorResponse(error);
  }
}
