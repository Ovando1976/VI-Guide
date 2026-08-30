import { NextRequest, NextResponse } from "next/server";

import { ensurePersonalAiConversation } from "@/lib/conversations/personal-ai";
import {
  ConversationAuthenticationError,
  verifiedConversationUserId,
} from "@/lib/conversations/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = await verifiedConversationUserId(request);
    const conversation = await ensurePersonalAiConversation(userId);
    return NextResponse.json(conversation, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ConversationAuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Personal Island AI provisioning failed.", error);
    return NextResponse.json(
      { error: "Island AI could not open your conversation." },
      { status: 500 },
    );
  }
}
