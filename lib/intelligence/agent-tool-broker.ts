import { createHash, randomUUID } from "node:crypto";

import type { AgentBlackboardTask } from "@/lib/intelligence/agent-blackboard";
import type { CollectiveAgentDescriptor } from "@/lib/intelligence/agent-registry";
import type { CoordinationRootIntent } from "@/lib/intelligence/agent-policy";
import type { IntelligenceToolDescriptor } from "@/lib/intelligence/tool-registry";
import {
  getAllHeritageRecords,
  searchHeritageRecords,
} from "@/lib/heritage/knowledge";
import {
  getTravelKnowledge,
  type TravelKnowledgeKind,
} from "@/lib/travel-knowledge";
import type {
  IntelligenceCapability,
  IntelligenceRequest,
} from "@/types/intelligence";

const DEFAULT_TIMEOUT_MS = 1_500;
const MAX_TIMEOUT_MS = 3_000;
const MAX_QUERY_LENGTH = 240;
const MAX_RESULTS = 5;
const MAX_SUMMARY_LENGTH = 600;
const MAX_SOURCE_URLS = 3;

const DIRECTORY_KINDS: readonly TravelKnowledgeKind[] = [
  "places",
  "beaches",
  "historic",
  "stays",
];

const AGENT_TOOL_ALLOWLIST: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    "island-concierge": Object.freeze([
      "directory.search",
      "heritage.search",
    ]),
    "travel-planner": Object.freeze(["directory.search"]),
    "knowledge-specialist": Object.freeze([
      "directory.search",
      "heritage.search",
    ]),
  });

export type AgentToolRequest = Readonly<{
  toolId: string;
  query: string;
}>;

export type AgentToolEvidenceRecord = Readonly<{
  id: string;
  title: string;
  summary: string;
  island?: string;
  kind: string;
  href?: string;
  sourceSystem: string;
  sourceId: string;
  reviewStatus?: string;
  sourceUrls: readonly string[];
}>;

export type AgentToolEvidence = Readonly<{
  toolId: string;
  capability: IntelligenceCapability;
  queryHash: string;
  records: readonly AgentToolEvidenceRecord[];
  sourceSystems: readonly string[];
  generatedAt: string;
}>;

export type AgentToolAuditStatus = "completed" | "rejected" | "failed";

export type AgentToolAuditRecord = Readonly<{
  id: string;
  toolId: string;
  agentId: string;
  taskId: string;
  rootIntentId: string;
  capability: IntelligenceCapability | null;
  status: AgentToolAuditStatus;
  reason: string | null;
  queryLength: number;
  queryHash: string;
  resultCount: number;
  sourceSystems: readonly string[];
  startedAt: string;
  durationMs: number;
}>;

export type AgentToolBrokerResult = Readonly<{
  status: AgentToolAuditStatus;
  evidence: AgentToolEvidence | null;
  audit: AgentToolAuditRecord;
}>;

export type AgentToolAdapterContext = Readonly<{
  request: IntelligenceRequest;
  query: string;
}>;

export type AgentToolAdapter = Readonly<{
  id: string;
  capability: IntelligenceCapability;
  execute(context: AgentToolAdapterContext): Promise<readonly AgentToolEvidenceRecord[]>;
}>;

type BrokerExecutionContext = Readonly<{
  request: IntelligenceRequest;
  rootIntent: CoordinationRootIntent;
  agent: CollectiveAgentDescriptor;
  task: AgentBlackboardTask;
  tools: readonly IntelligenceToolDescriptor[];
}>;

type ReadOnlyAgentToolBrokerOptions = {
  adapters?: readonly AgentToolAdapter[];
  timeoutMs?: number;
};

function queryHash(query: string) {
  return createHash("sha256").update(query).digest("hex").slice(0, 16);
}

function normalizeQuery(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

function queryTerms(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter((term) => term.length > 1),
    ),
  ).slice(0, 12);
}

function directoryHref(kind: TravelKnowledgeKind, slug: string) {
  if (kind === "beaches") return `/beaches/${slug}`;
  if (kind === "stays") return `/accommodations/${slug}`;
  if (kind === "historic") return `/historic/${slug}`;
  return `/places/${slug}`;
}

function sourceUrls(values: readonly (string | undefined)[]) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim()),
    ),
  ).slice(0, MAX_SOURCE_URLS);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("broker_timeout")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

const directorySearchAdapter: AgentToolAdapter = Object.freeze({
  id: "directory.search",
  capability: "recommend",
  async execute({ request, query }) {
    const terms = queryTerms(query);
    const ranked: Array<{
      score: number;
      record: AgentToolEvidenceRecord;
    }> = [];

    for (const kind of DIRECTORY_KINDS) {
      for (const item of getTravelKnowledge(kind)) {
        if (item.island !== request.context.island) continue;
        const haystack = [
          item.name,
          item.category,
          item.description,
          item.address,
          ...item.tags,
          ...(item.bestFor ?? []),
          ...(item.amenities ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const name = item.name.toLowerCase();
        let score = item.featured ? 2 : 0;
        if (name.includes(query.toLowerCase())) score += 20;
        for (const term of terms) {
          if (name.includes(term)) score += 8;
          if (haystack.includes(term)) score += 2;
        }
        if (score <= 0) continue;

        ranked.push({
          score,
          record: Object.freeze({
            id: item.id,
            title: item.name,
            summary: item.description.slice(0, MAX_SUMMARY_LENGTH),
            island: item.island,
            kind,
            href: directoryHref(kind, item.slug),
            sourceSystem: "travel-knowledge",
            sourceId: item.id,
            reviewStatus: item.imageStatus === "verified" ? "reviewed" : undefined,
            sourceUrls: Object.freeze(
              sourceUrls([
                item.sourceUrl,
                ...(item.sourceUrls ?? []),
                item.imageSourceUrl,
              ]),
            ),
          }),
        });
      }
    }

    return ranked
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.record.title.localeCompare(right.record.title),
      )
      .filter(
        (candidate, index, all) =>
          all.findIndex((other) => other.record.id === candidate.record.id) ===
          index,
      )
      .slice(0, MAX_RESULTS)
      .map(({ record }) => record);
  },
});

const heritageSearchAdapter: AgentToolAdapter = Object.freeze({
  id: "heritage.search",
  capability: "knowledge",
  async execute({ request, query }) {
    const records = getAllHeritageRecords().filter(
      (record) => !record.island || record.island === request.context.island,
    );
    const direct = searchHeritageRecords(records, query);
    const terms = queryTerms(query);
    const candidates = direct.length
      ? direct
      : records.filter((record) => {
          const haystack = [
            record.title,
            record.type,
            record.category,
            record.summary,
            record.significance,
            record.dateStart,
            record.dateEnd,
            ...record.searchTerms,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return terms.some((term) => haystack.includes(term));
        });

    return candidates.slice(0, MAX_RESULTS).map((record) =>
      Object.freeze({
        id: record.id,
        title: record.title,
        summary: record.summary.slice(0, MAX_SUMMARY_LENGTH),
        ...(record.island ? { island: record.island } : {}),
        kind: record.type,
        ...(record.href ? { href: record.href } : {}),
        sourceSystem: record.provenance.sourceSystem,
        sourceId: record.provenance.sourceId,
        reviewStatus: record.provenance.reviewStatus,
        sourceUrls: Object.freeze(
          sourceUrls(record.sources.map((source) => source.url)),
        ),
      }),
    );
  },
});

const DEFAULT_ADAPTERS: readonly AgentToolAdapter[] = Object.freeze([
  directorySearchAdapter,
  heritageSearchAdapter,
]);

function safeDescriptor(
  descriptor: IntelligenceToolDescriptor | undefined,
  context: BrokerExecutionContext,
  adapter: AgentToolAdapter | undefined,
) {
  if (!adapter) return "unsupported_tool";
  if (!descriptor || !descriptor.enabled) return "tool_unavailable";
  if (!AGENT_TOOL_ALLOWLIST[context.agent.id]?.includes(descriptor.id)) {
    return "agent_not_allowlisted";
  }
  if (descriptor.requiresConfirmation) return "confirmation_required";
  if (descriptor.risk === "high") return "high_risk_tool";
  if (
    descriptor.permissions.length === 0 ||
    descriptor.permissions.some((permission) => permission !== "read")
  ) {
    return "non_read_permission";
  }
  if (descriptor.capability !== adapter.capability) {
    return "adapter_capability_mismatch";
  }
  if (!context.rootIntent.allowedCapabilities.includes(descriptor.capability)) {
    return "root_intent_denied";
  }
  if (!context.task.requiredCapabilities.includes(descriptor.capability)) {
    return "task_capability_denied";
  }
  if (!context.agent.capabilities.includes(descriptor.capability)) {
    return "agent_capability_denied";
  }
  return null;
}

function sanitizeEvidenceRecords(records: readonly AgentToolEvidenceRecord[]) {
  return records.slice(0, MAX_RESULTS).map((record) =>
    Object.freeze({
      id: String(record.id).slice(0, 180),
      title: String(record.title).slice(0, 240),
      summary: String(record.summary).slice(0, MAX_SUMMARY_LENGTH),
      ...(record.island ? { island: String(record.island).slice(0, 24) } : {}),
      kind: String(record.kind).slice(0, 80),
      ...(record.href ? { href: String(record.href).slice(0, 500) } : {}),
      sourceSystem: String(record.sourceSystem).slice(0, 120),
      sourceId: String(record.sourceId).slice(0, 180),
      ...(record.reviewStatus
        ? { reviewStatus: String(record.reviewStatus).slice(0, 80) }
        : {}),
      sourceUrls: Object.freeze(sourceUrls(record.sourceUrls)),
    }),
  );
}

export class ReadOnlyAgentToolBroker {
  private readonly adapters = new Map<string, AgentToolAdapter>();
  private readonly timeoutMs: number;

  constructor(options: ReadOnlyAgentToolBrokerOptions = {}) {
    for (const adapter of options.adapters ?? DEFAULT_ADAPTERS) {
      if (this.adapters.has(adapter.id)) {
        throw new Error(`Duplicate read-only broker adapter: ${adapter.id}`);
      }
      this.adapters.set(adapter.id, adapter);
    }
    this.timeoutMs = Math.max(
      100,
      Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS),
    );
  }

  listAvailableToolIds(context: BrokerExecutionContext) {
    return context.tools
      .filter((descriptor) => {
        const adapter = this.adapters.get(descriptor.id);
        return safeDescriptor(descriptor, context, adapter) === null;
      })
      .map((descriptor) => descriptor.id)
      .sort();
  }

  async execute(
    request: AgentToolRequest,
    context: BrokerExecutionContext,
  ): Promise<AgentToolBrokerResult> {
    const started = Date.now();
    const startedAt = new Date(started).toISOString();
    const query = normalizeQuery(String(request.query ?? ""));
    const hash = queryHash(query);
    const descriptor = context.tools.find((tool) => tool.id === request.toolId);
    const adapter = this.adapters.get(request.toolId);
    const policyReason = safeDescriptor(descriptor, context, adapter);
    const queryReason =
      !query
        ? "empty_query"
        : query.length > MAX_QUERY_LENGTH
          ? "query_too_long"
          : null;

    const audit = (
      status: AgentToolAuditStatus,
      reason: string | null,
      records: readonly AgentToolEvidenceRecord[] = [],
    ): AgentToolAuditRecord =>
      Object.freeze({
        id: randomUUID(),
        toolId: String(request.toolId).slice(0, 120),
        agentId: context.agent.id,
        taskId: context.task.id,
        rootIntentId: context.rootIntent.id,
        capability: descriptor?.capability ?? null,
        status,
        reason,
        queryLength: query.length,
        queryHash: hash,
        resultCount: records.length,
        sourceSystems: Object.freeze(
          Array.from(new Set(records.map((record) => record.sourceSystem))).sort(),
        ),
        startedAt,
        durationMs: Math.max(0, Date.now() - started),
      });

    const rejectedReason = policyReason ?? queryReason;
    if (rejectedReason || !descriptor || !adapter) {
      return Object.freeze({
        status: "rejected",
        evidence: null,
        audit: audit("rejected", rejectedReason ?? "tool_unavailable"),
      });
    }

    try {
      const records = await withTimeout(
        adapter.execute({ request: context.request, query }),
        this.timeoutMs,
      );
      const safeRecords = Object.freeze(sanitizeEvidenceRecords(records));
      const systems = Object.freeze(
        Array.from(
          new Set(safeRecords.map((record) => record.sourceSystem)),
        ).sort(),
      );
      const evidence: AgentToolEvidence = Object.freeze({
        toolId: descriptor.id,
        capability: descriptor.capability,
        queryHash: hash,
        records: safeRecords,
        sourceSystems: systems,
        generatedAt: new Date().toISOString(),
      });
      return Object.freeze({
        status: "completed",
        evidence,
        audit: audit("completed", null, safeRecords),
      });
    } catch {
      return Object.freeze({
        status: "failed",
        evidence: null,
        audit: audit("failed", "adapter_failed_or_timed_out"),
      });
    }
  }
}

export function createConfiguredReadOnlyAgentToolBroker() {
  if (process.env.USVI_AGENT_TOOL_BROKER_SHADOW !== "1") return null;
  return new ReadOnlyAgentToolBroker();
}
