import type { ConciergeChatRequest, ConciergeReply } from "@/types/concierge";
import type { ConciergeDirectoryEvidence } from "@/lib/concierge-directory-evidence";

export type UnifiedConciergeReply = ConciergeReply & {
  evidence: ConciergeDirectoryEvidence[];
  evidenceMeta: {
    query: string;
    island: string;
    count: number;
    kinds: string[];
  };
};

export async function requestUnifiedConcierge(
  body: ConciergeChatRequest,
  signal?: AbortSignal,
): Promise<UnifiedConciergeReply> {
  const response = await fetch("/api/concierge/chat-unified", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  const payload = (await response.json().catch(() => null)) as
    | UnifiedConciergeReply
    | { error?: string }
    | null;

  if (!response.ok || !payload || !("message" in payload)) {
    const message = payload && "error" in payload ? payload.error : null;
    throw new Error(message || "The concierge could not respond.");
  }

  return payload;
}
