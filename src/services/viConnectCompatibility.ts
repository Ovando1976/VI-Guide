import type {
  VIConnectDateIdea,
  VIConnectIntent,
  VIConnectProfile,
  VIConnectUserProfile,
} from "../types/viConnect";

export type VIConnectCompatibility = {
  score: number;
  label: string;
  reasons: string[];
  suggestedDateIdea?: VIConnectDateIdea;
};

const intentLabels: Record<VIConnectIntent, string> = {
  dating: "dating",
  serious: "serious dating",
  friendship: "friendship",
  events: "events",
  networking: "networking",
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sharedValues(a: string[], b: string[]) {
  const bSet = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => bSet.has(item.toLowerCase()));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function findSuggestedDateIdea({
  userProfile,
  candidate,
  dateIdeas,
  sharedInterests,
}: {
  userProfile: VIConnectUserProfile | null;
  candidate: VIConnectProfile;
  dateIdeas: VIConnectDateIdea[];
  sharedInterests: string[];
}) {
  const preferredIsland = userProfile?.island || candidate.island;
  const sameIslandIdeas = dateIdeas.filter((idea) => idea.island === preferredIsland);
  const candidateIslandIdeas = dateIdeas.filter((idea) => idea.island === candidate.island);

  const pool = sameIslandIdeas.length ? sameIslandIdeas : candidateIslandIdeas.length ? candidateIslandIdeas : dateIdeas;

  const interestText = sharedInterests.join(" ").toLowerCase();

  const categoryPriority = [
    interestText.includes("coffee") ? "coffee" : "",
    interestText.includes("beach") ? "beach" : "",
    interestText.includes("history") ? "history" : "",
    interestText.includes("hiking") || interestText.includes("snorkeling") ? "adventure" : "",
    interestText.includes("sunset") ? "sunset" : "",
    interestText.includes("restaurant") || interestText.includes("food") ? "restaurant" : "",
  ].filter(Boolean);

  for (const category of categoryPriority) {
    const match = pool.find((idea) => idea.category === category);
    if (match) return match;
  }

  return pool[0];
}

export function getVIConnectCompatibility(
  userProfile: VIConnectUserProfile | null,
  candidate: VIConnectProfile,
  dateIdeas: VIConnectDateIdea[]
): VIConnectCompatibility {
  if (!userProfile) {
    const suggestedDateIdea = findSuggestedDateIdea({
      userProfile: null,
      candidate,
      dateIdeas,
      sharedInterests: candidate.interests,
    });

    return {
      score: candidate.verified ? 72 : 64,
      label: candidate.verified ? "Verified island profile" : "Profile preview",
      reasons: unique([
        candidate.verified ? "Verified profile" : "Verification pending",
        `${candidate.intent.map((intent) => intentLabels[intent]).join(", ")} intent`,
        `Favorite spot: ${candidate.favoriteSpot}`,
      ]).slice(0, 4),
      suggestedDateIdea,
    };
  }

  const sharedInterests = sharedValues(userProfile.interests || [], candidate.interests || []);
  const sharedIntent = sharedValues(userProfile.intent || [], candidate.intent || []);
  const sameIsland = userProfile.island === candidate.island;
  const localVisitorBlend =
    (userProfile.status === "visitor" && candidate.status === "local") ||
    (userProfile.status === "local" && candidate.status === "visitor");

  let score = 48;

  if (sameIsland) score += 18;
  if (localVisitorBlend) score += 8;
  if (candidate.verified) score += 8;

  score += Math.min(sharedInterests.length * 7, 21);
  score += Math.min(sharedIntent.length * 9, 18);

  if (candidate.intent.includes("serious") && userProfile.intent.includes("serious")) {
    score += 8;
  }

  if (candidate.status === "returning_home" && userProfile.status === "local") {
    score += 5;
  }

  score = clamp(score, 42, 98);

  const reasons: string[] = [];

  if (sameIsland) {
    reasons.push("Same island");
  } else {
    reasons.push("Different island, plan with ferry or trip timing");
  }

  if (sharedIntent.length) {
    reasons.push(
      `Shared intent: ${sharedIntent
        .map((intent) => intentLabels[intent as VIConnectIntent] || intent)
        .join(", ")}`
    );
  }

  if (sharedInterests.length) {
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(", ")}`);
  }

  if (localVisitorBlend) {
    reasons.push("Good local/visitor connection");
  }

  if (candidate.verified) {
    reasons.push("Verified profile");
  }

  if (candidate.favoriteSpot) {
    reasons.push(`Favorite spot: ${candidate.favoriteSpot}`);
  }

  const suggestedDateIdea = findSuggestedDateIdea({
    userProfile,
    candidate,
    dateIdeas,
    sharedInterests,
  });

  let label = "Island vibe match";
  if (score >= 90) label = "Exceptional island match";
  else if (score >= 80) label = "Strong island match";
  else if (score >= 70) label = "Good island match";
  else if (score < 60) label = "Explore carefully";

  return {
    score,
    label,
    reasons: unique(reasons).slice(0, 5),
    suggestedDateIdea,
  };
}
