import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getTravelKnowledge } from "@/lib/travel-knowledge";
import { runConciergeTool } from "@/lib/concierge-tools";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import type { ConciergeAction, ConciergeActionType, ConciergeChatRequest, ConciergeContext, ConciergeMessage, ConciergeReply, ConciergeTravelerProfile } from "@/types/concierge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUDGET = { maxModelCalls: 1, maxOutputTokens: 1800, maxRuntimeMs: 25_000, externalSpendLimitCents: 0, maxActions: 4, maxHistoryMessages: 10 } as const;
const ALLOWED_ACTIONS = new Set<ConciergeActionType>(["select_estate", "set_pickup", "set_destination", "open_estate", "open_mobility", "open_heritage", "open_itinerary"]);
const completedRequests = new Map<string, ConciergeReply>();
const rateWindows = new Map<string, number[]>();

type DirectoryRecommendation = { type: "place" | "beach"; name: string; description: string; category: string; island: string; estateGeoid: string | null; href: string };

type ToolEvidence = { tool: string; ok: boolean; evidence: unknown; warnings: string[] };

const RESPONSE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["answer", "suggestions", "actions"],
  properties: {
    answer: { type: "string" },
    suggestions: { type: "array", maxItems: 4, items: { type: "string" } },
    actions: { type: "array", maxItems: 4, items: { type: "object", additionalProperties: false, required: ["type", "label", "geoid", "href", "rationale"], properties: {
      type: { type: "string", enum: ["select_estate", "set_pickup", "set_destination", "open_estate", "open_mobility", "open_heritage", "open_itinerary"] },
      label: { type: "string" }, geoid: { type: ["string", "null"] }, href: { type: ["string", "null"] }, rationale: { type: "string" },
    } } },
  },
} as const;

const SYSTEM_INSTRUCTIONS = `You are USVI Explorer Concierge, a premium local trip-planning partner for the U.S. Virgin Islands.
Use liveAppContext, travelerMemory, directoryEvidence, and toolEvidence as your evidence. Answer the immediate question first. Personalize using traveler preferences when present. Recommend only named records supplied as evidence.
You may use the evidence produced by search_places, search_beaches, search_history, search_stays, nearby, check_time_budget, and build_day_plan. Tool evidence is authoritative for what the app currently knows; it does not prove current hours, availability, prices, weather, travel time, ferry schedules, or bookings.
For short cruise windows, preserve the protected return buffer and avoid overpacking. Never invent schedules or promise a booking. Never silently move the traveler between islands.
Taxi guidance: use the app fare engine as the sole fare authority; never calculate or invent fares. open_mobility is only a review screen.
Actions must be reversible. Only use estate GEOIDs present in liveAppContext or tool evidence. open_itinerary means open/update the in-app itinerary; it never books anything. Never claim money was spent, a ride was booked, a message was sent, or an external party was contacted.
Tone: warm, perceptive, polished, locally literate, concise. Sound like a trusted island host rather than a brochure.`;

function validIdentifier(value: unknown) { return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value); }
function rateLimit(clientId: string) {
  const now = Date.now(), start = now - 60_000;
  const attempts = (rateWindows.get(clientId) ?? []).filter((timestamp) => timestamp > start);
  if (attempts.length >= 12) return false;
  attempts.push(now); rateWindows.set(clientId, attempts);
  if (rateWindows.size > 1000) { const firstKey = rateWindows.keys().next().value as string | undefined; if (firstKey) rateWindows.delete(firstKey); }
  return true;
}
function normalizeEstate(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const estate = value as { geoid?: unknown; name?: unknown };
  if (typeof estate.geoid !== "string" || typeof estate.name !== "string") return null;
  return { geoid: estate.geoid.slice(0, 80), name: estate.name.slice(0, 120) };
}
function cleanTraveler(value: unknown): ConciergeTravelerProfile | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Record<string, unknown>;
  const list = (key: string) => Array.isArray(source[key]) ? source[key].filter((item): item is string => typeof item === "string").slice(0, 12).map((item) => item.slice(0, 80)) : undefined;
  const budget = ["value", "moderate", "premium", "luxury"].includes(String(source.budget)) ? source.budget as ConciergeTravelerProfile["budget"] : undefined;
  const pace = ["relaxed", "balanced", "active"].includes(String(source.pace)) ? source.pace as ConciergeTravelerProfile["pace"] : undefined;
  return { partySize: Math.max(1, Math.min(12, Number(source.partySize) || 1)), children: Math.max(0, Math.min(12, Number(source.children) || 0)), seniors: Math.max(0, Math.min(12, Number(source.seniors) || 0)), accessibilityNeeds: list("accessibilityNeeds"), budget, interests: list("interests"), pace, dislikes: list("dislikes"), lodgingName: typeof source.lodgingName === "string" ? source.lodgingName.slice(0, 120) : null, cruiseShip: typeof source.cruiseShip === "string" ? source.cruiseShip.slice(0, 120) : null, arrivalTime: typeof source.arrivalTime === "string" ? source.arrivalTime.slice(0, 20) : null, departureTime: typeof source.departureTime === "string" ? source.departureTime.slice(0, 20) : null };
}
function validateContext(value: unknown): ConciergeContext | null {
  if (!value || typeof value !== "object") return null;
  const context = value as ConciergeContext;
  if (context.island !== "stt" && context.island !== "stj" && context.island !== "stx") return null;
  const nearbyEstates = Array.isArray(context.nearbyEstates) ? context.nearbyEstates.map(normalizeEstate).filter((estate): estate is NonNullable<typeof estate> => Boolean(estate)).slice(0, 8) : [];
  return { island: context.island, islandName: String(context.islandName || "").slice(0, 80), selectedEstate: normalizeEstate(context.selectedEstate), pickup: normalizeEstate(context.pickup), destination: normalizeEstate(context.destination), rideMode: context.rideMode, passengers: Math.max(1, Math.min(12, Number(context.passengers) || 1)), luggage: Math.max(0, Math.min(12, Number(context.luggage) || 0)), activeLens: String(context.activeLens || "places").slice(0, 40), nearbyEstates, traveler: cleanTraveler(context.traveler) };
}
function normalizeHistory(value: unknown): ConciergeMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ConciergeMessage => Boolean(item && typeof item === "object" && (((item as Partial<ConciergeMessage>).role === "user") || ((item as Partial<ConciergeMessage>).role === "assistant")) && typeof (item as Partial<ConciergeMessage>).text === "string")).slice(-BUDGET.maxHistoryMessages).map((message) => ({ id: String(message.id || crypto.randomUUID()).slice(0, 100), role: message.role, text: message.text.trim().slice(0, 3000), createdAt: String(message.createdAt || new Date().toISOString()) }));
}
function buildMobilityHref(context: ConciergeContext) {
  const parameters = new URLSearchParams({ island: context.island, mode: context.rideMode, passengers: String(context.passengers), luggage: String(context.luggage) });
  if (context.pickup) parameters.set("from", context.pickup.geoid);
  if (context.destination) parameters.set("to", context.destination.geoid);
  return `/mobility?${parameters.toString()}`;
}
function sanitizeActions(value: unknown, context: ConciergeContext): ConciergeAction[] {
  if (!Array.isArray(value)) return [];
  const validEstates = new Map([context.selectedEstate, context.pickup, context.destination, ...context.nearbyEstates].filter((estate): estate is NonNullable<typeof estate> => Boolean(estate)).map((estate) => [estate.geoid, estate]));
  return value.slice(0, BUDGET.maxActions).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as { type?: unknown; label?: unknown; geoid?: unknown; href?: unknown; rationale?: unknown };
    if (typeof candidate.type !== "string" || !ALLOWED_ACTIONS.has(candidate.type as ConciergeActionType)) return [];
    const type = candidate.type as ConciergeActionType;
    const geoid = typeof candidate.geoid === "string" ? candidate.geoid : null;
    const estate = geoid ? validEstates.get(geoid) : null;
    if (!["open_mobility", "open_itinerary", "open_heritage"].includes(type) && !estate) return [];
    const href = type === "open_estate" && estate ? `/estate/${encodeURIComponent(estate.geoid)}` : type === "open_mobility" ? buildMobilityHref(context) : type === "open_itinerary" ? "/plans" : type === "open_heritage" ? "/heritage" : typeof candidate.href === "string" ? candidate.href : null;
    return [{ id: crypto.randomUUID(), type, label: typeof candidate.label === "string" ? candidate.label.trim().slice(0, 60) : "Apply suggestion", geoid: estate?.geoid ?? null, href, rationale: typeof candidate.rationale === "string" ? candidate.rationale.trim().slice(0, 180) : "Suggested from the current Explorer context.", risk: "local" as const, requiresApproval: false }];
  });
}
function meaningfulTokens(value: string) { const ignored = new Set(["about", "after", "before", "could", "from", "have", "help", "island", "looking", "need", "please", "that", "there", "this", "want", "what", "where", "with", "would"]); return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((token) => token.length > 3 && !ignored.has(token)); }
function loadDirectoryEvidence(context: ConciergeContext, message: string): DirectoryRecommendation[] {
  const island = context.island.toLowerCase();
  const rows: DirectoryRecommendation[] = [...getTravelKnowledge("places").map((item) => ({ type: "place" as const, name: item.name, description: item.description.slice(0, 240), category: item.category || "place", island: item.island.toUpperCase(), estateGeoid: item.estateGeoid ?? null, href: `/places/${encodeURIComponent(item.slug)}` })), ...getTravelKnowledge("beaches").map((item) => ({ type: "beach" as const, name: item.name, description: item.description.slice(0, 240), category: "beach", island: item.island.toUpperCase(), estateGeoid: item.estateGeoid ?? null, href: `/beaches/${encodeURIComponent(item.slug)}` }))].filter((item) => item.island.toLowerCase() === island);
  const tokens = meaningfulTokens(message), selectedGeoid = context.selectedEstate?.geoid, beachIntent = /beach|swim|sand|snorkel|surf|water/.test(message.toLowerCase());
  return rows.map((item) => { const haystack = `${item.name} ${item.category} ${item.description}`.toLowerCase(); const score = tokens.reduce((n, token) => n + (haystack.includes(token) ? 3 : 0), 0) + (selectedGeoid && item.estateGeoid === selectedGeoid ? 5 : 0) + (beachIntent && item.type === "beach" ? 2 : 0); return { item, score }; }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 18).map(({ item }) => item);
}
function intentTools(message: string, context: ConciergeContext): ToolEvidence[] {
  const normalized = message.toLowerCase();
  const evidence: ToolEvidence[] = [];
  const add = (tool: Parameters<typeof runConciergeTool>[0], input: Parameters<typeof runConciergeTool>[1]) => { const result = runConciergeTool(tool, input, context); evidence.push(result); };
  if (/\b(beach|snorkel|swim|sand|surf|water)\b/.test(normalized)) add("search_beaches", { query: message });
  if (/\b(place|restaurant|food|eat|activity|do|visit|thing|adventure|sail|scuba)\b/.test(normalized)) add("search_places", { query: message });
  if (/\b(history|historic|fort|culture|heritage)\b/.test(normalized)) add("search_history", { query: message });
  if (/\b(hotel|stay|lodging|resort|villa)\b/.test(normalized)) add("search_stays", { query: message });
  if (/\b(near|nearby|around|close)\b/.test(normalized)) add("nearby", {});
  if (/\b(cruise|ship|return|depart|departure|leave|hours|time)\b/.test(normalized) || context.traveler?.departureTime) {
    const minutes = context.traveler?.arrivalTime && context.traveler?.departureTime ? Math.max(0, Math.round((new Date(`1970-01-01T${context.traveler.departureTime}`).getTime() - new Date(`1970-01-01T${context.traveler.arrivalTime}`).getTime()) / 60000)) : 0;
    add("check_time_budget", { minutesAvailable: minutes });
    add("build_day_plan", { query: message, minutesAvailable: minutes });
  }
  if (/\b(plan|itinerary|day trip|day plan|two hours|three hours|multi-stop)\b/.test(normalized)) add("build_day_plan", { query: message, minutesAvailable: 0 });
  return evidence.slice(0, 7);
}
async function loadMemory(clientId: string): Promise<ConciergeTravelerProfile | undefined> {
  if (!hasFirebaseAdminConfiguration()) return undefined;
  try { const snapshot = await getAdminDb().collection("conciergeProfiles").doc(clientId).get(); return snapshot.exists ? cleanTraveler(snapshot.data()) : undefined; } catch (error) { console.warn("Unable to load Concierge traveler memory.", error); return undefined; }
}
async function saveMemory(clientId: string, profile: ConciergeTravelerProfile | undefined) {
  if (!hasFirebaseAdminConfiguration() || !profile) return false;
  try { await getAdminDb().collection("conciergeProfiles").doc(clientId).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); return true; } catch (error) { console.warn("Unable to save Concierge traveler memory.", error); return false; }
}
function inferMemory(message: string, existing: ConciergeTravelerProfile | undefined): ConciergeTravelerProfile | undefined {
  const profile = { ...(existing ?? {}) };
  const lower = message.toLowerCase();
  const interestMap: Array<[RegExp, string]> = [[/beach|snorkel|swim/, "beaches"], [/history|historic|fort|culture|heritage/, "history"], [/food|restaurant|eat|dining/, "food"], [/sail|sailing|charter/, "sailing"], [/scuba|dive|diving/, "scuba"], [/hike|hiking|adventure/, "adventure"]];
  const interests = new Set([...(profile.interests ?? [])]);
  for (const [pattern, value] of interestMap) if (pattern.test(lower)) interests.add(value);
  if (interests.size) profile.interests = [...interests].slice(0, 12);
  if (/luxury|upscale|high end/.test(lower)) profile.budget = "luxury"; else if (/premium/.test(lower)) profile.budget = "premium"; else if (/budget|cheap|affordable/.test(lower)) profile.budget = "value";
  if (/relaxed|slow|easy/.test(lower)) profile.pace = "relaxed"; else if (/active|adventure|packed/.test(lower)) profile.pace = "active";
  const party = lower.match(/\b(\d{1,2})\s+(?:people|persons|passengers|travelers|guests)\b/); if (party) profile.partySize = Math.max(1, Math.min(12, Number(party[1])));
  const children = lower.match(/\b(\d{1,2})\s+(?:kids|children)\b/); if (children) profile.children = Math.max(0, Math.min(12, Number(children[1])));
  return Object.keys(profile).length ? profile : existing;
}
function extractOutputText(payload: Record<string, unknown>) { if (typeof payload.output_text === "string") return payload.output_text; const output = Array.isArray(payload.output) ? payload.output : []; const parts: string[] = []; for (const item of output) { if (!item || typeof item !== "object") continue; const content = Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : []; for (const part of content) { if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") parts.push((part as { text: string }).text); } } return parts.join("\n"); }
async function requestOpenAI(parameters: { message: string; context: ConciergeContext; history: ConciergeMessage[]; directoryEvidence: DirectoryRecommendation[]; toolEvidence: ToolEvidence[]; memory?: ConciergeTravelerProfile }) {
  const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), BUDGET.maxRuntimeMs - 1500);
  try { const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5.6-sol", store: false, instructions: SYSTEM_INSTRUCTIONS, input: JSON.stringify({ liveAppContext: parameters.context, travelerMemory: parameters.memory ?? null, recentConversation: parameters.history.map(({ role, text }) => ({ role, text })), directoryEvidence: parameters.directoryEvidence, toolEvidence: parameters.toolEvidence, userMessage: parameters.message }), reasoning: { effort: "medium" }, max_output_tokens: BUDGET.maxOutputTokens, text: { format: { type: "json_schema", name: "vi_guide_concierge_response", strict: true, schema: RESPONSE_SCHEMA } } }) }); const payload = await response.json().catch(() => null) as Record<string, unknown> | null; if (!response.ok || !payload) { const apiError = payload?.error as { message?: unknown } | undefined; throw new Error(typeof apiError?.message === "string" ? apiError.message : `OpenAI request failed with status ${response.status}.`); } const outputText = extractOutputText(payload); if (!outputText) throw new Error("The model returned no readable response."); const parsed = JSON.parse(outputText) as { answer?: unknown; suggestions?: unknown; actions?: unknown }; if (typeof parsed.answer !== "string" || !parsed.answer.trim()) throw new Error("The model response did not contain an answer."); const usage = payload.usage as { output_tokens?: unknown } | undefined; return { answer: parsed.answer.trim().slice(0, 5000), suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 100)).filter(Boolean).slice(0, 4) : [], actions: Array.isArray(parsed.actions) ? parsed.actions.filter((action): action is Record<string, unknown> => Boolean(action) && typeof action === "object" && !Array.isArray(action)) : [], outputTokens: typeof usage?.output_tokens === "number" ? usage.output_tokens : 0 }; } finally { clearTimeout(timeout); }
}
function buildLocalReply(message: string, context: ConciergeContext, directoryEvidence: DirectoryRecommendation[], toolEvidence: ToolEvidence[]) {
  const normalized = message.toLowerCase(), selected = context.selectedEstate, pickup = context.pickup, destination = context.destination, neighbor = context.nearbyEstates[0] ?? null;
  const actions: Array<Record<string, unknown>> = []; let answer: string;
  if (/plan|itinerary|day trip|day plan/.test(normalized) || toolEvidence.some((item) => item.tool === "build_day_plan")) { answer = "I can build a day plan from the places, beaches and time constraints currently available in USVI Explorer. Open your itinerary to review the draft before acting on it."; actions.push({ type: "open_itinerary", label: "Open my itinerary", geoid: null, rationale: "Review the evidence-grounded planning draft." }); }
  else if (/ride|route|taxi|pickup|airport|ferry|transport/.test(normalized)) { if (pickup && destination) { answer = `Your current ${context.islandName} corridor is ${pickup.name} to ${destination.name} for ${context.passengers} ${context.passengers === 1 ? "passenger" : "passengers"}. Open the ride review to see the territory-regulated taxi estimate before submitting it.`; actions.push({ type: "open_mobility", label: "Review this ride", geoid: null, rationale: "The pickup and destination are already set." }); } else if (selected && !pickup) { answer = `${selected.name} is selected. Set it as your pickup, then choose a different destination.`; actions.push({ type: "set_pickup", label: `Use ${selected.name} as pickup`, geoid: selected.geoid, rationale: "This uses the estate currently selected on the map." }); } else if (pickup && neighbor) { answer = `${pickup.name} is set as pickup. ${neighbor.name} is one nearby mapped destination.`; actions.push({ type: "set_destination", label: `Set ${neighbor.name} as destination`, geoid: neighbor.geoid, rationale: "It is among the closest mapped estates." }); } else answer = `Select an estate on the ${context.islandName} map and I will help turn it into a pickup or destination.`; }
  else if (selected) { answer = `${selected.name} is the active estate on ${context.islandName}. I can open its profile, use it as a trip endpoint, or compare it with nearby estates.`; actions.push({ type: "open_estate", label: `Open ${selected.name}`, geoid: selected.geoid, rationale: "View the estate record and its local context." }, { type: "set_pickup", label: "Use as pickup", geoid: selected.geoid, rationale: "Prepare a route without creating a booking." }); }
  else { const names = directoryEvidence.slice(0, 3).map((item) => item.name); answer = names.length ? `For ${context.islandName}, a few directory-backed starting points are ${names.join(", ")}. Tell me whether you want food, beach time, history, or taxi logistics and I’ll narrow the plan.` : `I am ready to help explore ${context.islandName}. Ask about nearby places, beaches, stays, history, or regulated taxi transportation.`; }
  return { answer, suggestions: ["Help me plan a ride", selected ? `What is near ${selected.name}?` : `What is nearby on ${context.islandName}?`, "Build my day"], actions, outputTokens: 0 };
}
async function loadDurableHistory(sessionId: string, clientId: string) { if (!hasFirebaseAdminConfiguration()) return []; try { const ref = getAdminDb().collection("conciergeSessions").doc(sessionId); const snap = await ref.get(); if (snap.exists && snap.data()?.clientId !== clientId) return []; const messages = await ref.collection("messages").orderBy("createdAt", "desc").limit(BUDGET.maxHistoryMessages).get(); return messages.docs.map((document) => { const data = document.data(); return { id: document.id, role: data.role === "assistant" ? "assistant" : "user", text: String(data.text || ""), createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString() } satisfies ConciergeMessage; }).reverse(); } catch (error) { console.warn("Unable to load durable concierge history.", error); return []; } }
async function persistReply(parameters: { request: ConciergeChatRequest; reply: ConciergeReply }) { if (!hasFirebaseAdminConfiguration()) return false; try { const database = getAdminDb(); const sessionReference = database.collection("conciergeSessions").doc(parameters.request.sessionId); const runReference = database.collection("agentRuns").doc(parameters.reply.runId); const requestReference = database.collection("conciergeRequests").doc(`${parameters.request.clientId}_${parameters.request.idempotencyKey}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 180)); const userMessageReference = sessionReference.collection("messages").doc(); const assistantMessageReference = sessionReference.collection("messages").doc(); const eventReference = database.collection("agentEvents").doc(); const batch = database.batch(); batch.set(sessionReference, { clientId: parameters.request.clientId, context: parameters.request.context, lastMessage: parameters.reply.message.text.slice(0, 240), updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() }, { merge: true }); batch.set(userMessageReference, { role: "user", text: parameters.request.message, runId: parameters.reply.runId, createdAt: FieldValue.serverTimestamp() }); batch.set(assistantMessageReference, { role: "assistant", text: parameters.reply.message.text, actions: parameters.reply.actions, provider: parameters.reply.provider, runId: parameters.reply.runId, createdAt: FieldValue.serverTimestamp() }); batch.set(runReference, { sessionId: parameters.request.sessionId, clientId: parameters.request.clientId, objective: parameters.request.message, context: parameters.request.context, budget: parameters.reply.budget, provider: parameters.reply.provider, status: "completed", createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp() }); batch.set(requestReference, { status: "completed", runId: parameters.reply.runId, reply: parameters.reply, createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp() }); batch.set(eventReference, { runId: parameters.reply.runId, type: "run_completed", details: { provider: parameters.reply.provider, budget: parameters.reply.budget, actions: parameters.reply.actions.map((action) => ({ type: action.type, geoid: action.geoid, risk: action.risk })) }, createdAt: FieldValue.serverTimestamp() }); await batch.commit(); return true; } catch (error) { console.warn("Unable to persist concierge session.", error); return false; } }
export async function POST(request: NextRequest) {
  const startedAt = Date.now(), runId = crypto.randomUUID();
  try {
    const body = (await request.json().catch(() => null)) as Partial<ConciergeChatRequest> | null;
    if (!body || !validIdentifier(body.sessionId) || !validIdentifier(body.clientId) || !validIdentifier(body.idempotencyKey)) return NextResponse.json({ error: "The concierge request identifiers are invalid." }, { status: 400 });
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 3000) return NextResponse.json({ error: "Enter a message between 1 and 3,000 characters." }, { status: 400 });
    const context = validateContext(body.context); if (!context) return NextResponse.json({ error: "The current Explorer context is invalid." }, { status: 400 });
    if (!rateLimit(body.clientId as string)) return NextResponse.json({ error: "The concierge is receiving too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": "30" } });
    const requestKey = `${body.clientId}_${body.idempotencyKey}`; const cached = completedRequests.get(requestKey); if (cached) return NextResponse.json(cached, { headers: { "X-Concierge-Idempotent-Replay": "true" } });
    const durableHistory = await loadDurableHistory(body.sessionId as string, body.clientId as string); const history = durableHistory.length ? durableHistory : normalizeHistory(body.recentMessages); const memory = await loadMemory(body.clientId as string); const mergedContext = { ...context, traveler: context.traveler ?? memory };
    const toolEvidence = intentTools(message, mergedContext); const directoryEvidence = loadDirectoryEvidence(mergedContext, message);
    let provider: ConciergeReply["provider"] = "local"; let result = buildLocalReply(message, mergedContext, directoryEvidence, toolEvidence); let modelCallsUsed = 0;
    if (process.env.OPENAI_API_KEY) { try { modelCallsUsed = 1; result = await requestOpenAI({ message, context: mergedContext, history, directoryEvidence, toolEvidence, memory }); provider = "openai"; } catch (error) { console.error("OpenAI concierge request failed. Using local fallback.", error); } }
    const inferredMemory = inferMemory(message, memory); const memorySaved = await saveMemory(body.clientId as string, inferredMemory);
    const reply: ConciergeReply = { runId, sessionId: body.sessionId as string, message: { id: crypto.randomUUID(), role: "assistant", text: result.answer, createdAt: new Date().toISOString() }, suggestions: result.suggestions.slice(0, 4), actions: sanitizeActions(result.actions, mergedContext), budget: { maxModelCalls: BUDGET.maxModelCalls, modelCallsUsed, maxOutputTokens: BUDGET.maxOutputTokens, outputTokensUsed: result.outputTokens, maxRuntimeMs: BUDGET.maxRuntimeMs, runtimeMs: Date.now() - startedAt, externalSpendLimitCents: BUDGET.externalSpendLimitCents, externalSpendCents: 0 }, provider, memoryStatus: memorySaved || hasFirebaseAdminConfiguration() ? "durable" : "session-only" };
    const persisted = await persistReply({ request: { sessionId: body.sessionId as string, clientId: body.clientId as string, idempotencyKey: body.idempotencyKey as string, message, context: mergedContext, recentMessages: history }, reply }); if (persisted) reply.memoryStatus = "durable";
    completedRequests.set(requestKey, reply); if (completedRequests.size > 200) { const firstKey = completedRequests.keys().next().value as string | undefined; if (firstKey) completedRequests.delete(firstKey); }
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store", "X-Concierge-Run-Id": runId } });
  } catch (error) { console.error("Concierge request failed.", error); return NextResponse.json({ error: error instanceof Error ? error.message : "The concierge could not complete this request." }, { status: 500 }); }
}
