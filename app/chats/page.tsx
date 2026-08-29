import type { Metadata } from "next";

import { SocialChatShell } from "@/components/chats/social-chat-shell";

export const metadata: Metadata = {
  title: "Chats",
  description:
    "Private, persistent social AI conversations for island life in the U.S. Virgin Islands.",
};

export default function ChatsPage() {
  return <SocialChatShell />;
}
