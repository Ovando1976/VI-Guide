export type PartnerPipelineStatus =
  | "new"
  | "reviewing"
  | "needs_information"
  | "approved"
  | "declined";

export type PartnerFollowUpState =
  | "closed"
  | "overdue"
  | "due_today"
  | "scheduled"
  | "unscheduled";

export type PartnerPipelineRecord = {
  status?: unknown;
  assignedToUid?: unknown;
  assignedToEmail?: unknown;
  nextFollowUpDate?: unknown;
  lastContactedAt?: unknown;
};

export function normalizePartnerPipelineAction(value: unknown) {
  return [
    "assign_to_me",
    "unassign",
    "schedule_follow_up",
    "clear_follow_up",
    "mark_contacted",
  ].includes(String(value))
    ? (String(value) as
        | "assign_to_me"
        | "unassign"
        | "schedule_follow_up"
        | "clear_follow_up"
        | "mark_contacted")
    : null;
}

export function normalizePartnerFollowUpDate(value: unknown) {
  const date = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && isRealDate(date) ? date : null;
}

export function normalizePartnerOwnerEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)
    ? email.slice(0, 220)
    : null;
}

export function partnerTodayDateKey(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function partnerFollowUpState(
  record: PartnerPipelineRecord,
  now: Date = new Date(),
): PartnerFollowUpState {
  const status = String(record.status ?? "new") as PartnerPipelineStatus;
  if (status === "approved" || status === "declined") return "closed";

  const nextFollowUpDate = normalizePartnerFollowUpDate(record.nextFollowUpDate);
  if (!nextFollowUpDate) return "unscheduled";

  const today = partnerTodayDateKey(now);
  if (nextFollowUpDate < today) return "overdue";
  if (nextFollowUpDate === today) return "due_today";
  return "scheduled";
}

export function summarizePartnerPipeline(
  records: PartnerPipelineRecord[],
  now: Date = new Date(),
) {
  return records.reduce(
    (summary, record) => {
      const state = partnerFollowUpState(record, now);
      if (state === "closed") {
        summary.closed += 1;
        return summary;
      }

      summary.active += 1;
      if (!normalizePartnerOwnerEmail(record.assignedToEmail)) {
        summary.unassigned += 1;
      }
      if (state === "overdue") summary.overdue += 1;
      if (state === "due_today") summary.dueToday += 1;
      if (state === "scheduled") summary.scheduled += 1;
      if (state === "unscheduled") summary.unscheduled += 1;
      if (record.lastContactedAt) summary.contacted += 1;
      return summary;
    },
    {
      active: 0,
      unassigned: 0,
      overdue: 0,
      dueToday: 0,
      scheduled: 0,
      unscheduled: 0,
      contacted: 0,
      closed: 0,
    },
  );
}

export function partnerPipelinePatch(input: {
  action: NonNullable<ReturnType<typeof normalizePartnerPipelineAction>>;
  sessionUid: string;
  sessionEmail?: string | null;
  nextFollowUpDate?: unknown;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();

  if (input.action === "assign_to_me") {
    const email = normalizePartnerOwnerEmail(input.sessionEmail);
    if (!email || !input.sessionUid.trim()) return null;
    return {
      assignedToUid: input.sessionUid.trim().slice(0, 160),
      assignedToEmail: email,
      assignedAt: nowIso,
      updatedAt: nowIso,
    };
  }

  if (input.action === "unassign") {
    return {
      assignedToUid: null,
      assignedToEmail: null,
      assignedAt: null,
      updatedAt: nowIso,
    };
  }

  if (input.action === "schedule_follow_up") {
    const nextFollowUpDate = normalizePartnerFollowUpDate(input.nextFollowUpDate);
    if (!nextFollowUpDate || nextFollowUpDate < partnerTodayDateKey(now)) {
      return null;
    }
    return { nextFollowUpDate, updatedAt: nowIso };
  }

  if (input.action === "clear_follow_up") {
    return { nextFollowUpDate: null, updatedAt: nowIso };
  }

  return {
    lastContactedAt: nowIso,
    lastContactedByUid: input.sessionUid.trim().slice(0, 160) || null,
    lastContactedByEmail: normalizePartnerOwnerEmail(input.sessionEmail),
    updatedAt: nowIso,
  };
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
