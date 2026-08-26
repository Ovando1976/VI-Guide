export const MERCHANT_ACQUISITION_STAGES = [
  "discovered",
  "profile_created",
  "contacted",
  "claimed",
  "verified",
  "bookable",
  "revenue_active",
] as const;

export type MerchantAcquisitionStage =
  (typeof MERCHANT_ACQUISITION_STAGES)[number];

export type MerchantRegistryStatus =
  | "active"
  | "paused"
  | "do_not_contact"
  | "closed";

export type MerchantRegistryRecord = {
  stage?: unknown;
  status?: unknown;
  businessName?: unknown;
  island?: unknown;
  assignedToUid?: unknown;
  assignedToEmail?: unknown;
  nextFollowUpDate?: unknown;
  lastContactedAt?: unknown;
};

export const MERCHANT_REGISTRY_ACTIONS = [
  "assign_to_me",
  "unassign",
  "schedule_follow_up",
  "clear_follow_up",
  "mark_contacted",
  "advance_stage",
  "save_note",
  "set_status",
] as const;

export type MerchantRegistryAction = (typeof MERCHANT_REGISTRY_ACTIONS)[number];

export function normalizeMerchantAcquisitionStage(value: unknown) {
  const stage = String(value ?? "").trim();
  return MERCHANT_ACQUISITION_STAGES.includes(stage as MerchantAcquisitionStage)
    ? (stage as MerchantAcquisitionStage)
    : null;
}

export function normalizeMerchantRegistryStatus(value: unknown) {
  const status = String(value ?? "").trim();
  return ["active", "paused", "do_not_contact", "closed"].includes(status)
    ? (status as MerchantRegistryStatus)
    : null;
}

export function normalizeMerchantRegistryAction(value: unknown) {
  const action = String(value ?? "").trim();
  return MERCHANT_REGISTRY_ACTIONS.includes(action as MerchantRegistryAction)
    ? (action as MerchantRegistryAction)
    : null;
}

export function merchantStageIndex(value: unknown) {
  const stage = normalizeMerchantAcquisitionStage(value);
  return stage ? MERCHANT_ACQUISITION_STAGES.indexOf(stage) : -1;
}

export function canAdvanceMerchantStage(current: unknown, next: unknown) {
  const currentIndex = merchantStageIndex(current);
  const nextIndex = merchantStageIndex(next);
  return currentIndex >= 0 && nextIndex >= currentIndex;
}

export function maxMerchantStage(
  current: unknown,
  candidate: unknown,
): MerchantAcquisitionStage {
  const currentStage = normalizeMerchantAcquisitionStage(current) ?? "discovered";
  const candidateStage = normalizeMerchantAcquisitionStage(candidate) ?? "discovered";
  return merchantStageIndex(candidateStage) > merchantStageIndex(currentStage)
    ? candidateStage
    : currentStage;
}

export function normalizeMerchantFollowUpDate(value: unknown) {
  const date = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && isRealDate(date) ? date : null;
}

export function merchantTodayDateKey(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function merchantFollowUpState(
  record: MerchantRegistryRecord,
  now: Date = new Date(),
) {
  const status = normalizeMerchantRegistryStatus(record.status) ?? "active";
  if (status === "closed" || status === "do_not_contact") return "closed" as const;

  const nextFollowUpDate = normalizeMerchantFollowUpDate(record.nextFollowUpDate);
  if (!nextFollowUpDate) return "unscheduled" as const;

  const today = merchantTodayDateKey(now);
  if (nextFollowUpDate < today) return "overdue" as const;
  if (nextFollowUpDate === today) return "due_today" as const;
  return "scheduled" as const;
}

export function summarizeMerchantRegistry(
  records: MerchantRegistryRecord[],
  now: Date = new Date(),
) {
  const stages = Object.fromEntries(
    MERCHANT_ACQUISITION_STAGES.map((stage) => [stage, 0]),
  ) as Record<MerchantAcquisitionStage, number>;

  const summary = {
    total: records.length,
    active: 0,
    paused: 0,
    doNotContact: 0,
    closed: 0,
    unassigned: 0,
    overdue: 0,
    dueToday: 0,
    scheduled: 0,
    unscheduled: 0,
    stages,
  };

  for (const record of records) {
    const stage = normalizeMerchantAcquisitionStage(record.stage) ?? "discovered";
    summary.stages[stage] += 1;

    const status = normalizeMerchantRegistryStatus(record.status) ?? "active";
    if (status === "active") summary.active += 1;
    if (status === "paused") summary.paused += 1;
    if (status === "do_not_contact") summary.doNotContact += 1;
    if (status === "closed") summary.closed += 1;

    if (!cleanText(record.assignedToEmail, 220)) summary.unassigned += 1;

    const followUp = merchantFollowUpState(record, now);
    if (followUp === "overdue") summary.overdue += 1;
    if (followUp === "due_today") summary.dueToday += 1;
    if (followUp === "scheduled") summary.scheduled += 1;
    if (followUp === "unscheduled") summary.unscheduled += 1;
  }

  return summary;
}

export function normalizeMerchantRegistryKey(value: unknown) {
  return cleanText(value, 200)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function merchantRegistryCanonicalKey(island: unknown, businessName: unknown) {
  const islandKey = normalizeMerchantRegistryKey(island);
  const nameKey = normalizeMerchantRegistryKey(businessName);
  return islandKey && nameKey ? `${islandKey}:${nameKey}` : "";
}

export function merchantRegistryDocumentId(island: unknown, businessName: unknown) {
  const canonicalKey = merchantRegistryCanonicalKey(island, businessName);
  if (!canonicalKey) return "";
  return `merchant_${canonicalKey.replace(":", "_").slice(0, 180)}`;
}

export function humanizeMerchantValue(value: unknown) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRealDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
