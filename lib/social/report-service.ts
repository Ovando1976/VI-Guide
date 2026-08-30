import { getAdminDb } from "@/lib/firebase-admin";
import { cleanSocialText, socialNow } from "@/lib/social/utils";
import type { SocialReport, SocialReportReason, SocialReportTargetType } from "@/types/social";

const TARGETS = new Set<SocialReportTargetType>(["user", "post", "message", "community", "comment"]);
const REASONS = new Set<SocialReportReason>([
  "spam", "harassment", "hate", "violence", "sexual", "fraud", "impersonation", "privacy", "other",
]);

export async function createSocialReport(
  reporterId: string,
  input: Readonly<{ targetType: unknown; targetId: unknown; reason: unknown; details?: unknown }>,
) {
  if (!TARGETS.has(input.targetType as SocialReportTargetType)) throw new Error("Invalid report target.");
  if (!REASONS.has(input.reason as SocialReportReason)) throw new Error("Invalid report reason.");
  const targetId = cleanSocialText(input.targetId, 160);
  if (!targetId) throw new Error("Report target is required.");
  const db = getAdminDb();
  const ref = db.collection("socialReports").doc();
  const now = socialNow();
  const report: SocialReport = {
    version: 1,
    id: ref.id,
    reporterId,
    targetType: input.targetType as SocialReportTargetType,
    targetId,
    reason: input.reason as SocialReportReason,
    details: cleanSocialText(input.details, 2000),
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(report);
  return report;
}

export async function listOpenSocialReports(limit = 100) {
  const snapshot = await getAdminDb()
    .collection("socialReports")
    .where("status", "in", ["open", "reviewing"])
    .orderBy("createdAt", "asc")
    .limit(Math.max(1, Math.min(limit, 200)))
    .get();
  return snapshot.docs.map((doc) => doc.data() as SocialReport);
}

export async function updateSocialReportStatus(
  reportId: string,
  status: SocialReport["status"],
) {
  if (!["open", "reviewing", "resolved", "dismissed"].includes(status)) throw new Error("Invalid report status.");
  await getAdminDb().collection("socialReports").doc(reportId).update({ status, updatedAt: socialNow() });
}
