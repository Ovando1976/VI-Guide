import {
  GptOssAdvisoryAgentWorker,
  OpenAIAdvisoryAgentWorker,
  type AgentWorker,
} from "@/lib/intelligence/agent-worker";
import { IslandIntelligenceRouterWorker } from "@/lib/intelligence/model-router";

function openAIWorker() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAIAdvisoryAgentWorker({
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || undefined,
  });
}

function gptOssWorker() {
  const endpoint = process.env.GPT_OSS_RESPONSES_URL?.trim();
  if (!endpoint) return null;
  return new GptOssAdvisoryAgentWorker({
    endpoint,
    apiKey: process.env.GPT_OSS_API_KEY,
    model: process.env.GPT_OSS_MODEL?.trim() || "gpt-oss-20b",
  });
}

export function createConfiguredConversationAiWorker(): AgentWorker | null {
  if (process.env.USVI_CHAT_AI_ENABLED === "0") return null;

  const provider = (
    process.env.USVI_CHAT_MODEL_PROVIDER ||
    process.env.USVI_AGENT_MODEL_PROVIDER ||
    "auto"
  )
    .trim()
    .toLowerCase();

  const openai = openAIWorker();
  const gptOss = gptOssWorker();

  if (provider === "openai") return openai;
  if (provider === "gpt-oss" || provider === "gpt_oss" || provider === "oss") {
    return gptOss;
  }
  if (provider !== "auto" && provider !== "router" && provider !== "hybrid") {
    return null;
  }

  if (openai && gptOss) {
    return new IslandIntelligenceRouterWorker({ openai, gptOss });
  }
  return openai ?? gptOss;
}
