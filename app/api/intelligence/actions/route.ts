import { NextResponse } from "next/server";

import {
  executeRegisteredAction,
  listRegisteredActions,
  type ActionExecutionRequest,
} from "@/lib/intelligence/action-engine";

export const runtime = "nodejs";

const ISLANDS = new Set(["stt", "stj", "stx"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRequest(value: unknown): ActionExecutionRequest | null {
  if (!isRecord(value) || typeof value.actionId !== "string" || !isRecord(value.context)) {
    return null;
  }

  const context = value.context;
  if (
    typeof context.sessionId !== "string" ||
    !context.sessionId.trim() ||
    typeof context.island !== "string" ||
    !ISLANDS.has(context.island)
  ) {
    return null;
  }

  return {
    actionId: value.actionId,
    confirmed: value.confirmed === true,
    payload: isRecord(value.payload) ? value.payload : {},
    context: {
      sessionId: context.sessionId,
      ...(typeof context.userId === "string" && context.userId ? { userId: context.userId } : {}),
      island: context.island as "stt" | "stj" | "stx",
      ...(typeof context.workflowId === "string" && context.workflowId
        ? { workflowId: context.workflowId }
        : {}),
      ...(typeof context.runId === "string" && context.runId ? { runId: context.runId } : {}),
    },
  };
}

export async function GET() {
  return NextResponse.json({ actions: listRegisteredActions() });
}

export async function POST(request: Request) {
  try {
    const parsed = parseRequest(await request.json());
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid action request." },
        { status: 400 },
      );
    }

    const result = await executeRegisteredAction(parsed);
    const status =
      result.status === "pending_confirmation"
        ? 409
        : result.status === "failed"
          ? 422
          : 200;

    return NextResponse.json(result, {
      status,
      headers: {
        "X-VI-Action-Execution": result.executionId,
      },
    });
  } catch (error) {
    console.error("Action API failed.", error);
    return NextResponse.json(
      { error: "Unable to execute the requested action." },
      { status: 500 },
    );
  }
}
