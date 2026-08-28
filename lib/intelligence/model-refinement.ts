import { attachIslandUIEnvelope } from "@/lib/intelligence/island-ui-bindings";
import { buildIslandModuleBindings } from "@/lib/intelligence/island-module-bindings";
import { normalizeIslandPresentationPlan } from "@/lib/intelligence/island-ui-plan";
import { evaluateTripRisk } from "@/lib/intelligence/trip-risk";
import type {
  IntelligenceAction,
  IntelligencePlanStop,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const MAX_RUNTIME_MS = 22_000;
const MAX_OUTPUT_TOKENS = 1_900;

const UI_COMPONENTS = [
  "WorldCanvas",
  "MissionTimeline",
  "RecommendationDeck",
  "CatalogDeck",
  "EvidenceStrip",
  "AgentActivity",
  "WarningPanel",
  "ConfirmationCard",
  "ActionDock",
] as const;
const UI_SOURCES = [
  "workspace",
  "plan",
  "recommendations",
  "catalog",
  "evidence",
  "agents",
  "warnings",
  "actions",
] as const;
const UI_VARIANTS = [
  "primary",
  "compact",
  "expanded",
  "route",
  "persistent",
] as const;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "recommendationIds", "plan", "presentation"],
  properties: {
    answer: { type: "string" },
    recommendationIds: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    plan: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "recommendationId",
          "startTime",
          "durationMinutes",
          "reason",
        ],
        properties: {
          recommendationId: { type: "string" },
          startTime: { type: ["string", "null"] },
          durationMinutes: { type: "integer", minimum: 30, maximum: 360 },
          reason: { type: "string" },
        },
      },
    },
    presentation: {
      type: "object",
      additionalProperties: false,
      required: ["mode", "focus", "blocks"],
      properties: {
        mode: {
          type: "string",
          enum: [
            "discovery",
            "journey",
            "mobility",
            "booking",
            "knowledge",
          ],
        },
        focus: {
          type: "string",
          enum: [
            "world",
            "mission",
            "recommendations",
            "mobility",
            "knowledge",
          ],
        },
        blocks: {
          type: "array",
          maxItems: 9,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "component",
              "source",
              "bindingIds",
              "variant",
              "priority",
            ],
            properties: {
              component: { type: "string", enum: UI_COMPONENTS },
              source: { type: "string", enum: UI_SOURCES },
              bindingIds: {
                type: "array",
                maxItems: 8,
                items: { type: "string" },
              },
              variant: { type: "string", enum: UI_VARIANTS },
              priority: { type: "integer", minimum: 0, maximum: 100 },
            },
          },
        },
      },
    },
  },
} as const;

const INSTRUCTIONS = `
You are the itinerary-planning and presentation-composition intelligence for USVI Explorer, a U.S. Virgin Islands travel platform.

Build a practical response using only supplied candidate recommendations and supplied catalogCandidates. Never invent a place, business, beach, accommodation, historic site, operator, event, ferry, price, schedule, availability, travel time, image URL, source URL, fare, booking confirmation, payment state, or action authority.

Planning rules:
- Respect the requested island, party, pace, budget, interests, accessibility needs, pickup, stay, cruise constraints, active saved trip, and proactive trip-risk report.
- Resolve critical and high trip risks before adding optional experiences. Protect return-to-ship windows and realistic transfer buffers.
- When an active trip exists, treat it as the traveler's current plan. Avoid duplicate stops and explain whether your recommendation adds to, replaces, or improves that plan.
- Preserve the traveler's confirmed or ready stops unless the request explicitly asks to rebuild them or a safety/logistics risk requires a change.
- Prefer a coherent sequence over a long list. Do not overpack the day.
- Use only exact candidate recommendation IDs in recommendationIds and plan. Catalog candidate IDs are presentation/reference bindings only and cannot become plan stops through this response.
- You may describe supplied catalogCandidates in the answer, but preserve their exact semantics. An experience status such as operator-listed is not live inventory. A car-rental source record is not a confirmed vehicle. A ferry schedule status or notice must be preserved as a verification warning where supplied.
- Use null for startTime unless the traveler supplied a meaningful time or the sequence benefits from an approximate start.
- Treat directory records as known places, not proof of current hours or availability.
- Mention one concrete logistics consideration when relevant.
- Lead with the useful answer. Avoid generic promotional language.
- If the request is not an itinerary, return an empty plan and rank the most useful recommendations.

Presentation rules:
- presentation controls layout and emphasis only. It never creates facts or authority.
- Use only the listed component names, sources, variants, and exact binding IDs supplied in availableUIBindings.
- WorldCanvas is the spatial context surface. MissionTimeline is for plans or missing information. RecommendationDeck is for grounded recommendation IDs. CatalogDeck is for exact connected-catalog binding IDs. ActionDock is for server-issued action IDs only.
- Do not hide warnings, confirmation requirements, or governed actions. The server will enforce mandatory safety blocks regardless of your layout.
- Never place raw HTML, JavaScript, CSS, URLs, image paths, prices, schedules, or prose facts inside presentation blocks.
- Prefer a small number of high-signal blocks and assign higher priority to the user's immediate objective.
`;

type ModelPayload = {
  answer?: unknown;
  recommendationIds?: unknown;
  plan?: unknown;
  presentation?: unknown;
};

type ModelPlanItem = {
  recommendationId?: unknown;
  startTime?: unknown;
  durationMinutes?: unknown;
  reason?: unknown;
};

export async function refineIntelligenceResponse(
  request: IntelligenceRequest,
  base: IntelligenceResponse,
): Promise<IntelligenceResponse> {
  const tripRisk = evaluateTripRisk(
    request.context.memory.activeTrip,
    request.context.memory,
    { now: request.context.now },
  );
  const riskWarnings = tripRisk.issues
    .filter(
      (issue) =>
        issue.severity === "critical" ||
        issue.severity === "high" ||
        issue.severity === "medium",
    )
    .slice(0, 4)
    .map((issue) => `${issue.title}: ${issue.recommendation}`);
  const groundedBase: IntelligenceResponse = riskWarnings.length
    ? {
        ...base,
        warnings: Array.from(new Set([...base.warnings, ...riskWarnings])),
      }
    : base;
  const moduleBindings = buildIslandModuleBindings(request, groundedBase);
  const catalogBindingIds = Object.keys(moduleBindings);

  if (
    !process.env.OPENAI_API_KEY ||
    (!groundedBase.recommendations.length && !catalogBindingIds.length)
  ) {
    return attachIslandUIEnvelope(groundedBase, undefined, request);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MAX_RUNTIME_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
        store: false,
        instructions: INSTRUCTIONS,
        input: JSON.stringify({
          travelerRequest: request.message,
          intent: groundedBase.intent,
          context: {
            island: request.context.island,
            page: request.context.page,
            party: request.context.party,
            preferences: request.context.preferences,
            currentLocation: request.context.currentLocation,
            selectedPlace: request.context.selectedPlace,
            pickup: request.context.pickup,
            stay: request.context.memory.stay,
            cruise: request.context.memory.cruise,
            activeTrip: request.context.memory.activeTrip,
            tripRisk: {
              status: tripRisk.status,
              score: tripRisk.score,
              summary: tripRisk.summary,
              returnWindow: tripRisk.returnWindow,
              issues: tripRisk.issues.slice(0, 6).map((issue) => ({
                severity: issue.severity,
                category: issue.category,
                title: issue.title,
                detail: issue.detail,
                recommendation: issue.recommendation,
              })),
            },
          },
          candidates: groundedBase.recommendations.map((item) => ({
            id: item.id,
            title: item.title,
            kind: item.kind,
            island: item.island,
            summary: item.summary,
            reasons: item.reasons,
          })),
          catalogCandidates: Object.values(moduleBindings).map((item) => ({
            id: item.id,
            title: item.title,
            kind: item.kind,
            island: item.island,
            summary: item.summary,
            meta: item.meta ?? [],
            status: item.status ?? null,
            sourceSystem: item.provenance.sourceSystem,
            reviewStatus: item.provenance.reviewStatus,
            verifiedAt: item.provenance.verifiedAt ?? null,
          })),
          availableUIBindings: {
            recommendationIds: groundedBase.recommendations.map(
              (item) => item.id,
            ),
            catalogIds: catalogBindingIds,
            actionIds: groundedBase.actions.map((action) => ({
              id: action.id,
              type: action.type,
              requiresConfirmation: action.requiresConfirmation,
            })),
            hasPlan: groundedBase.plan.length > 0,
            hasWarnings: groundedBase.warnings.length > 0,
            hasEvidence: Boolean(groundedBase.orchestration?.trace.length),
            hasAgents: Boolean(
              groundedBase.orchestration?.coordination?.team.length,
            ),
          },
        }),
        reasoning: { effort: "medium" },
        max_output_tokens: MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: "vi_guide_intelligence_and_ui_plan",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!response.ok || !payload) {
      return attachIslandUIEnvelope(groundedBase, undefined, request);
    }

    const output = JSON.parse(extractOutputText(payload)) as ModelPayload;
    const answer =
      typeof output.answer === "string" && output.answer.trim()
        ? output.answer.trim().slice(0, 5_000)
        : groundedBase.answer;
    const candidates = new Map(
      groundedBase.recommendations.map((item) => [item.id, item]),
    );
    const orderedIds = validRecommendationIds(
      output.recommendationIds,
      candidates,
    );
    const recommendations = [
      ...orderedIds.map((id) => candidates.get(id)!),
      ...groundedBase.recommendations.filter(
        (item) => !orderedIds.includes(item.id),
      ),
    ];
    const plan = buildValidatedPlan(output.plan, candidates);
    const finalPlan =
      plan.length || groundedBase.intent !== "day_plan"
        ? plan
        : groundedBase.plan;
    const actions = synchronizeActions(
      groundedBase.actions,
      finalPlan,
      request.context.island,
    );
    const refined: IntelligenceResponse = {
      ...groundedBase,
      answer,
      recommendations,
      plan: finalPlan,
      actions,
    };
    const presentation = normalizeIslandPresentationPlan(
      output.presentation,
      refined,
      catalogBindingIds,
    );
    return attachIslandUIEnvelope(refined, presentation, request);
  } catch (error) {
    console.warn(
      "USVI Explorer model refinement fell back to the grounded engine.",
      error,
    );
    return attachIslandUIEnvelope(groundedBase, undefined, request);
  } finally {
    clearTimeout(timeout);
  }
}

function validRecommendationIds(
  value: unknown,
  candidates: Map<
    string,
    IntelligenceResponse["recommendations"][number]
  >,
) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter(
        (id): id is string =>
          typeof id === "string" && candidates.has(id),
      ),
    ),
  ).slice(0, 8);
}

function buildValidatedPlan(
  value: unknown,
  candidates: Map<
    string,
    IntelligenceResponse["recommendations"][number]
  >,
): IntelligencePlanStop[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const plan: IntelligencePlanStop[] = [];

  for (const raw of value.slice(0, 5)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as ModelPlanItem;
    if (
      typeof item.recommendationId !== "string" ||
      seen.has(item.recommendationId)
    ) {
      continue;
    }
    const candidate = candidates.get(item.recommendationId);
    if (!candidate) continue;
    seen.add(item.recommendationId);
    const duration = Math.max(
      30,
      Math.min(360, Number(item.durationMinutes) || 75),
    );
    const startTime =
      typeof item.startTime === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime)
        ? item.startTime
        : undefined;
    const reason =
      typeof item.reason === "string" && item.reason.trim()
        ? item.reason.trim().slice(0, 500)
        : candidate.summary;
    const previous = plan[plan.length - 1];

    plan.push({
      id: `ai_${plan.length + 1}_${candidate.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`.slice(
        0,
        160,
      ),
      title: candidate.title,
      island: candidate.island,
      kind: candidate.kind,
      summary: reason,
      placeId: candidate.id,
      durationMinutes: duration,
      ...(startTime ? { startTime } : {}),
      ...(typeof candidate.lat === "number" ? { lat: candidate.lat } : {}),
      ...(typeof candidate.lng === "number" ? { lng: candidate.lng } : {}),
      ...(candidate.href ? { href: candidate.href } : {}),
      ...(candidate.mapHref ? { mapHref: candidate.mapHref } : {}),
      ...(candidate.kind === "stays" && candidate.href
        ? { bookingHref: candidate.href }
        : {}),
      mobility: {
        ...(previous ? { from: previous.title } : {}),
        to: candidate.title,
        mode: "transfer",
      },
    });
  }

  return plan;
}

function synchronizeActions(
  actions: IntelligenceAction[],
  plan: IntelligencePlanStop[],
  island: string,
) {
  return actions.map((action) => {
    if (action.type === "save_plan") {
      return { ...action, payload: { ...action.payload, plan } };
    }
    if (action.type === "plan_ride" && plan[0]) {
      const params = new URLSearchParams({
        island,
        destination: plan[0].title,
      });
      if (typeof plan[0].lat === "number") {
        params.set("toLat", String(plan[0].lat));
      }
      if (typeof plan[0].lng === "number") {
        params.set("toLng", String(plan[0].lng));
      }
      return {
        ...action,
        label: `Plan transportation to ${plan[0].title}`,
        href: `/mobility?${params.toString()}`,
      };
    }
    return action;
  });
}

function extractOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text) {
    return payload.output_text;
  }
  const output = Array.isArray(payload.output) ? payload.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }
  if (!parts.length) {
    throw new Error("The model returned no readable output.");
  }
  return parts.join("\n");
}
