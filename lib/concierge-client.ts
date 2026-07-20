import type { ConciergeChatRequest, ConciergeReply } from "@/types/concierge";

export type ConciergeEvidenceItem = {
  type: "place" | "beach" | "stay" | "historic";
  name: string;
  description: string;
  category: string;
  island: string;
  estateGeoid: string | null;
  href: string;
  score: number;
  tags: string[];
};

export type UnifiedConciergeReply = ConciergeReply & {
  evidence: ConciergeEvidenceItem[];
  evidenceMeta: {
    query: string;
    island: string;
    count: number;
    kinds: string[];
  };
};

type EvidenceResponse = {
  query: string;
  island: string;
  count: number;
  evidence: ConciergeEvidenceItem[];
};

export async function requestUnifiedConcierge(
  body: ConciergeChatRequest,
  signal?: AbortSignal,
): Promise<UnifiedConciergeReply> {
  const evidenceParams = new URLSearchParams({
    q: body.message,
    island: body.context.island,
    limit: "12",
  });

  if (body.context.selectedEstate?.geoid) {
    evidenceParams.set("estateGeoid", body.context.selectedEstate.geoid);
  }

  const [chatResponse, evidenceResponse] = await Promise.all([
    fetch("/api/concierge/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
    fetch(`/api/concierge/evidence?${evidenceParams.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal,
    }).catch(() => null),
  ]);

  const chatPayload = (await chatResponse.json().catch(() => null)) as
    | ConciergeReply
    | { error?: string }
    | null;

  if (!chatResponse.ok || !chatPayload || !("message" in chatPayload)) {
    const message = chatPayload && "error" in chatPayload ? chatPayload.error : null;
    throw new Error(message || "The concierge could not respond.");
  }

  let evidencePayload: EvidenceResponse | null = null;
  if (evidenceResponse?.ok) {
    evidencePayload = (await evidenceResponse.json().catch(() => null)) as EvidenceResponse | null;
  }

  const evidence = Array.isArray(evidencePayload?.evidence) ? evidencePayload.evidence : [];

  return {
    ...chatPayload,
    evidence,
    evidenceMeta: {
      query: body.message,
      island: body.context.island,
      count: evidence.length,
      kinds: Array.from(new Set(evidence.map((item) => item.type))),
    },
  };
}
