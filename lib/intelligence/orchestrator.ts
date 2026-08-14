import { runIntelligenceEngine } from "@/lib/intelligence/engine";
import type {
  IntelligenceAction,
  IntelligenceCapability,
  IntelligenceOrchestrationStep,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

type OrchestrationState = {
  request: IntelligenceRequest;
  intent?: string;
  requiredCapabilities: IntelligenceCapability[];
  missingInformation: string[];
  result?: IntelligenceResponse;
  trace: IntelligenceOrchestrationStep[];
};

type NodeName =
  | "classify"
  | "authorize"
  | "ground"
  | "plan"
  | "validate"
  | "finalize";

type GraphNode = (
  state: OrchestrationState,
) => OrchestrationState | Promise<OrchestrationState>;

const ALL_CAPABILITIES: readonly IntelligenceCapability[] = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
];

function addTrace(
  state: OrchestrationState,
  node: NodeName,
  status: IntelligenceOrchestrationStep["status"],
  detail: string,
): OrchestrationState {
  return {
    ...state,
    trace: [
      ...state.trace,
      {
        node,
        status,
        detail,
        completedAt: new Date().toISOString(),
      },
    ],
  };
}

function inferIntent(message: string) {
  const text = message.toLowerCase();
  if (/\b(book|booking|reserve|reservation|room|hotel|stay)\b/.test(text)) {
    return "booking";
  }
  if (/\b(ride|taxi|pickup|drop.?off|ferry|transport|transfer)\b/.test(text)) {
    return "mobility";
  }
  if (/\b(day|itinerary|schedule|cruise|plan|trip)\b/.test(text)) {
    return "day_plan";
  }
  if (/\b(history|historic|governor|timeline|heritage|learn)\b/.test(text)) {
    return "knowledge";
  }
  if (/\b(where|nearby|recommend|best|find|search)\b/.test(text)) {
    return "recommendation";
  }
  return "discovery";
}

function capabilitiesForIntent(intent: string): IntelligenceCapability[] {
  switch (intent) {
    case "booking":
      return ["recommend", "plan", "map", "mobility", "booking"];
    case "mobility":
      return ["recommend", "map", "mobility"];
    case "day_plan":
      return ["recommend", "plan", "map", "mobility"];
    case "knowledge":
      return ["knowledge", "recommend", "map"];
    case "recommendation":
      return ["recommend", "map"];
    default:
      return ["recommend"];
  }
}

function allowedCapabilities(request: IntelligenceRequest) {
  const requested = request.capabilities?.length
    ? request.capabilities
    : [...ALL_CAPABILITIES];
  return new Set(requested);
}

function hasTravelDate(message: string) {
  return /\b(today|tomorrow|tonight|this (?:morning|afternoon|evening|weekend)|next (?:week|weekend)|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i.test(
    message,
  );
}

function findMissingInformation(state: OrchestrationState) {
  const missing: string[] = [];
  const { request, intent } = state;

  if (intent === "booking" && !hasTravelDate(request.message)) {
    missing.push("travel dates");
  }

  if (intent === "mobility") {
    const hasPickup = Boolean(
      request.context.pickup ||
        request.context.currentLocation ||
        /\bfrom\s+[^,.]+/i.test(request.message),
    );
    const hasDestination = Boolean(
      request.context.destination || /\bto\s+[^,.]+/i.test(request.message),
    );
    if (!hasPickup) missing.push("pickup location");
    if (!hasDestination) missing.push("destination");
  }

  return missing;
}

function followUpAction(missingInformation: string[]): IntelligenceAction {
  const label =
    missingInformation.length === 1
      ? `Add ${missingInformation[0]}`
      : `Add ${missingInformation.slice(0, -1).join(", ")} and ${missingInformation.at(-1)}`;

  return {
    id: "provide_missing_information",
    type: "ask_follow_up",
    label,
    payload: { missingInformation },
    requiresConfirmation: false,
  };
}

const classifyNode: GraphNode = (state) => {
  const intent = inferIntent(state.request.message);
  const requiredCapabilities = capabilitiesForIntent(intent);
  return addTrace(
    { ...state, intent, requiredCapabilities },
    "classify",
    "completed",
    `Routed request to ${intent}.`,
  );
};

const authorizeNode: GraphNode = (state) => {
  const allowed = allowedCapabilities(state.request);
  const blocked = state.requiredCapabilities.filter(
    (capability) => !allowed.has(capability),
  );
  const requiredCapabilities = state.requiredCapabilities.filter((capability) =>
    allowed.has(capability),
  );

  return addTrace(
    { ...state, requiredCapabilities },
    "authorize",
    blocked.length ? "limited" : "completed",
    blocked.length
      ? `Disabled unavailable capabilities: ${blocked.join(", ")}.`
      : "All required capabilities are available.",
  );
};

const groundNode: GraphNode = (state) => {
  const result = runIntelligenceEngine({
    ...state.request,
    capabilities: state.requiredCapabilities,
  });
  return addTrace(
    { ...state, result },
    "ground",
    result.recommendations.length ? "completed" : "limited",
    result.recommendations.length
      ? `Grounded the response in ${result.recommendations.length} reviewed USVI Explorer records.`
      : "No sufficiently strong reviewed record matched the request.",
  );
};

const planNode: GraphNode = (state) => {
  const missingInformation = findMissingInformation(state);
  return addTrace(
    { ...state, missingInformation },
    "plan",
    missingInformation.length ? "waiting" : "completed",
    missingInformation.length
      ? `The workflow needs ${missingInformation.join(" and ")} before execution.`
      : "The workflow has enough information to prepare user actions.",
  );
};

const validateNode: GraphNode = (state) => {
  if (!state.result) {
    throw new Error("The orchestration graph reached validation without a grounded result.");
  }

  const warnings = [...state.result.warnings];
  let actions = [...state.result.actions];

  if (state.missingInformation.length) {
    actions = actions.filter(
      (action) => action.type !== "start_booking" && action.type !== "plan_ride",
    );
    actions.push(followUpAction(state.missingInformation));
    warnings.push(
      `The agent paused before taking action because ${state.missingInformation.join(
        " and ",
      )} must be confirmed.`,
    );
  }

  actions = actions.map((action) =>
    action.type === "start_booking"
      ? { ...action, requiresConfirmation: true }
      : action,
  );

  const result: IntelligenceResponse = {
    ...state.result,
    actions,
    warnings: Array.from(new Set(warnings)),
  };

  return addTrace(
    { ...state, result },
    "validate",
    state.missingInformation.length ? "waiting" : "completed",
    state.missingInformation.length
      ? "Unsafe or incomplete execution actions were replaced with a follow-up request."
      : "Action boundaries and confirmation requirements passed validation.",
  );
};

const finalizeNode: GraphNode = (state) => {
  if (!state.result) {
    throw new Error("The orchestration graph reached finalization without a result.");
  }

  const finalState = addTrace(
    state,
    "finalize",
    "completed",
    "Prepared the final response and execution trace.",
  );

  const answer = state.missingInformation.length
    ? `${state.result.answer} Before I continue, I need ${state.missingInformation.join(
        " and ",
      )}.`
    : state.result.answer;

  return {
    ...finalState,
    result: {
      ...state.result,
      answer,
      orchestration: {
        status: state.missingInformation.length ? "waiting_for_user" : "ready",
        intent: state.intent ?? state.result.intent,
        requiredCapabilities: state.requiredCapabilities,
        missingInformation: state.missingInformation,
        trace: finalState.trace,
      },
    },
  };
};

const GRAPH: readonly GraphNode[] = [
  classifyNode,
  authorizeNode,
  groundNode,
  planNode,
  validateNode,
  finalizeNode,
];

export async function runIntelligenceOrchestrator(
  request: IntelligenceRequest,
): Promise<IntelligenceResponse> {
  let state: OrchestrationState = {
    request,
    requiredCapabilities: [],
    missingInformation: [],
    trace: [],
  };

  for (const node of GRAPH) {
    state = await node(state);
  }

  if (!state.result) {
    throw new Error("The intelligence orchestration graph produced no result.");
  }

  return state.result;
}
