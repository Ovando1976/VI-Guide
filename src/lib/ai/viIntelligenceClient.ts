// src/lib/ai/viIntelligenceClient.ts

import type {
    ViIntelligenceRequest,
    ViIntelligenceResponse,
  } from "./viIntelligenceTypes";
  
  const DEFAULT_ENDPOINT = "/api/vi-intelligence";
  
  type ViIntelligenceClientOptions = {
    signal?: AbortSignal;
  };
  
  function getEndpoint() {
    return (
      import.meta.env.VITE_VI_INTELLIGENCE_ENDPOINT ||
      import.meta.env.VITE_AI_CONCIERGE_ENDPOINT ||
      DEFAULT_ENDPOINT
    );
  }
  
  export async function askViIntelligence(
    request: ViIntelligenceRequest,
    options: ViIntelligenceClientOptions = {},
  ): Promise<ViIntelligenceResponse> {
    const endpoint = getEndpoint();
  
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: options.signal,
      body: JSON.stringify({
        ...request,
        timestamp: new Date().toISOString(),
      }),
    });
  
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
  
      throw new Error(
        `VI Intelligence request failed: ${response.status} ${response.statusText}${
          errorText ? ` — ${errorText}` : ""
        }`,
      );
    }
  
    const data = (await response.json()) as Partial<ViIntelligenceResponse>;
  
    return normalizeViIntelligenceResponse(data);
  }
  
  function normalizeViIntelligenceResponse(
    data: Partial<ViIntelligenceResponse>,
  ): ViIntelligenceResponse {
    return {
      answer:
        data.answer ||
        "I’m here, but I did not receive a complete response from the VI Guide intelligence engine.",
      intent: data.intent || "general_help",
      confidence: data.confidence || "medium",
  
      listings: data.listings || [],
      events: data.events || [],
      plan: data.plan || [],
      actions: data.actions || [],
  
      leadDraft: data.leadDraft,
      missingFields: data.missingFields || [],
      memorySignals: data.memorySignals || [],
  
      provider: data.provider || "VI Guide Intelligence",
      access: data.access || {},
      suggestedRoutes: data.suggestedRoutes || {},
  
      debug: data.debug,
    };
  }