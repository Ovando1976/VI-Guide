import { NextResponse } from "next/server";

import { ReadOnlyAgentToolBroker } from "@/lib/intelligence/agent-tool-broker";
import { OpenAIAdvisoryAgentWorker } from "@/lib/intelligence/agent-worker";
import { runAgentWorkerShadow } from "@/lib/intelligence/agent-worker-runtime";
import {
  listIntelligenceTools,
  publicToolDescriptor,
} from "@/lib/intelligence/tool-registry";
import type { IntelligenceRequest } from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANARY_BRANCH = "canary/agent-shadow-single-session-20260828";
const EXPIRES_AT = "2026-08-28T17:00:00.000Z";

function unavailable(reason: string, status = 404) {
  return NextResponse.json(
    { status: "unavailable", reason },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return unavailable("preview_only");
  }
  if (process.env.VERCEL_GIT_COMMIT_REF !== CANARY_BRANCH) {
    return unavailable("branch_denied");
  }
  if (Date.now() >= Date.parse(EXPIRES_AT)) {
    return unavailable("canary_expired", 410);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        status: "blocked",
        reason: "preview_openai_key_unavailable",
        environment: "preview",
        branch: CANARY_BRANCH,
        expiresAt: EXPIRES_AT,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const request: IntelligenceRequest = {
    message:
      "Find one reviewed St. Thomas beach that fits a first-time visitor who values scenery and easy access. Use grounded directory evidence when available and challenge any unsupported assumption.",
    context: {
      sessionId: "agent_canary_20260828_01",
      page: "concierge",
      island: "stt",
      now: new Date().toISOString(),
      timezone: "America/St_Thomas",
      party: { adults: 2, children: 0, accessibilityNeeds: [] },
      preferences: {
        interests: ["beaches", "scenery", "easy access"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: ["recommend", "knowledge"],
  };

  const tools = listIntelligenceTools().map(publicToolDescriptor);
  const result = await runAgentWorkerShadow({
    request,
    requiredCapabilities: ["recommend", "knowledge"],
    tools,
    worker: new OpenAIAdvisoryAgentWorker({
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-5.6-sol",
      timeoutMs: 8_000,
      maxOutputTokens: 600,
    }),
    broker: new ReadOnlyAgentToolBroker(),
    maxWorkerTasks: 1,
  });

  return NextResponse.json(
    {
      status: "completed",
      environment: "preview",
      branch: CANARY_BRANCH,
      expiresAt: EXPIRES_AT,
      requestClass: "synthetic_non_user",
      shadow: {
        status: result.workerShadow.status,
        model: result.workerShadow.model,
        attemptedTasks: result.workerShadow.attemptedTasks,
        completedTasks: result.workerShadow.completedTasks,
        failedTasks: result.workerShadow.failedTasks,
        modelCalls: result.workerShadow.modelCalls,
        brokerCalls: result.workerShadow.brokerCalls,
        brokerCompleted: result.workerShadow.brokerCompleted,
        brokerRejected: result.workerShadow.brokerRejected,
        brokerFailed: result.workerShadow.brokerFailed,
        acceptedDelegations: result.workerShadow.acceptedDelegations,
        rejectedDelegations: result.workerShadow.rejectedDelegations,
        brokerAudits: result.workerShadow.brokerAudits.map((audit) => ({
          toolId: audit.toolId,
          status: audit.status,
          reason: audit.reason,
          resultCount: audit.resultCount,
          sourceSystems: audit.sourceSystems,
          durationMs: audit.durationMs,
        })),
      },
      coordination: {
        status: result.coordination.status,
        agentCount: result.coordination.team.length,
        taskCount: result.coordination.tasks.length,
        messageCount: result.coordination.messageCount,
        missingCapabilities: result.coordination.missingCapabilities,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
