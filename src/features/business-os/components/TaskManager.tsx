import { useMemo, useState } from "react";
import { CheckCircle2, Clock, ListTodo, Loader2, Plus } from "lucide-react";

import type { BusinessLead } from "../../../types/business";
import {
  createBusinessTask,
  createBusinessTimelineEvent,
  updateBusinessTaskStatus,
  type BusinessTask,
} from "../firestore";
import type { BusinessOSData } from "../types";
import { formatDate } from "../utils";
import { BusinessOSCard, SectionHeader } from "./BusinessOSCard";

type TaskStatus = "open" | "done" | "cancelled";

type UiTask = {
  id: string;
  title: string;
  businessName: string;
  businessId?: string;
  leadId?: string;
  dueLabel: string;
  status: TaskStatus;
  priority?: string;
  source: "firestore" | "lead" | "manual";
};

export default function TaskManager({
  data,
  onRefresh,
}: {
  data: BusinessOSData;
  onRefresh?: () => void;
}) {
  const liveTasks = useMemo(() => buildLiveTasks(data), [data]);
  const leadTasks = useMemo(() => buildLeadTasks(data), [data]);

  const [manualTasks, setManualTasks] = useState<UiTask[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const tasks = [...manualTasks, ...liveTasks, ...leadTasks];
  const openCount = tasks.filter((task) => task.status === "open").length;

  const defaultBusinessId = data.businesses[0]?.id ?? "";

  async function addTask() {
    const title = draft.trim();

    if (!title) return;

    if (!defaultBusinessId) {
      setNotice("Create or claim a business listing before saving tasks.");
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const taskId = await createBusinessTask({
        businessId: defaultBusinessId,
        title,
        priority: "normal",
        dueAt: Date.now(),
      });
      await createBusinessTimelineEvent({
       businessId: defaultBusinessId,
       type: "task",
       title: "Task created",
       description: title,
       source: "Business OS",
     });

     onRefresh?.();

      const businessName =
        data.businessById.get(defaultBusinessId)?.name || "Saved Task";

      setManualTasks((current) => [
        {
          id: taskId,
          title,
          businessId: defaultBusinessId,
          businessName,
          dueLabel: "Today",
          status: "open",
          priority: "normal",
          source: "manual",
        },
        ...current,
      ]);

      setDraft("");
      onRefresh?.();
    } catch (error) {
      console.error("Failed to create business task:", error);
      setNotice("Task could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: UiTask) {
    if (task.source === "lead") return;

    const nextStatus: TaskStatus = task.status === "open" ? "done" : "open";

    if (task.source === "manual") {
      setManualTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: nextStatus } : item,
        ),
      );
    }

    setUpdatingTaskId(task.id);
    setNotice(null);

    try {
      await updateBusinessTaskStatus(task.id, nextStatus);

      if (task.businessId) {
      await createBusinessTimelineEvent({
       businessId: task.businessId,
       leadId: task.leadId,
       type: "task",
       title: `Task marked ${nextStatus}`,
       description: task.title,
       source: "Business OS",
       });
      }

    } catch (error) {
      console.error("Failed to update task:", error);
      setNotice("Task status could not be updated.");

      if (task.source === "manual") {
        setManualTasks((current) =>
          current.map((item) =>
            item.id === task.id ? { ...item, status: task.status } : item,
          ),
        );
      }
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <BusinessOSCard>
      <SectionHeader
        title="Task Manager"
        text={`${openCount} open action item${openCount === 1 ? "" : "s"} needing attention.`}
        icon={ListTodo}
      />

      <div id="business-tasks" className="border-b border-white/10 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void addTask();
            }}
            placeholder="Add follow-up task..."
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-white outline-none placeholder:text-white/35 focus:border-cyan-300"
          />

          <button
            type="button"
            onClick={() => void addTask()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-slate-950 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving" : "Add Task"}
          </button>
        </div>

        {notice ? (
          <p className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-bold text-yellow-100">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="divide-y divide-white/10">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-cyan-300" />
            <h3 className="mt-4 text-2xl font-black">No tasks yet</h3>
            <p className="mt-2 text-sm text-white/60">
              Saved tasks, lead follow-ups, and manual action items will appear here.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isUpdating = updatingTaskId === task.id;
            const canToggle = task.source !== "lead";

            return (
              <div key={task.id} className="flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-white">{task.title}</p>
                    <TaskSourceBadge source={task.source} />
                    {task.priority ? <PriorityBadge priority={task.priority} /> : null}
                  </div>

                  <p className="mt-1 text-sm text-cyan-200">{task.businessName}</p>

                  <p className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                    <Clock className="h-3.5 w-3.5" />
                    {task.dueLabel}
                  </p>
                </div>

                {canToggle ? (
                  <button
                    type="button"
                    onClick={() => void toggleTask(task)}
                    disabled={isUpdating}
                    className={`rounded-full px-4 py-2 text-xs font-black disabled:opacity-60 ${
                      task.status === "done"
                        ? "bg-emerald-300 text-slate-950"
                        : task.status === "cancelled"
                          ? "bg-red-300 text-slate-950"
                          : "bg-yellow-300 text-slate-950"
                    }`}
                  >
                    {isUpdating
                      ? "Saving"
                      : task.status === "done"
                        ? "Done"
                        : task.status === "cancelled"
                          ? "Cancelled"
                          : "Open"}
                  </button>
                ) : (
                  <span className="rounded-full bg-yellow-300 px-4 py-2 text-xs font-black text-slate-950">
                    Follow Up
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </BusinessOSCard>
  );
}

function buildLiveTasks(data: BusinessOSData): UiTask[] {
  return data.tasks
    .slice()
    .sort((a, b) => {
      const aDue = typeof a.dueAt === "number" ? a.dueAt : Number.MAX_SAFE_INTEGER;
      const bDue = typeof b.dueAt === "number" ? b.dueAt : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .slice(0, 20)
    .map((task: BusinessTask) => ({
      id: task.id,
      businessId: task.businessId,
      leadId: task.leadId,
      title: task.title,
      businessName: data.businessById.get(task.businessId)?.name || "Unknown business",
      dueLabel: task.dueAt ? formatDate(task.dueAt) : "No due date",
      status: task.status,
      priority: task.priority,
      source: "firestore",
    }));
}

function buildLeadTasks(data: BusinessOSData): UiTask[] {
  const liveLeadTaskIds = new Set(
    data.tasks.map((task) => task.leadId).filter(Boolean),
  );

  return data.leads
    .filter((lead) => !liveLeadTaskIds.has(lead.id))
    .filter((lead) => !lead.status || lead.status === "new" || lead.status === "contacted")
    .slice(0, 8)
    .map((lead: BusinessLead) => ({
      id: `lead-${lead.id}`,
      businessId: lead.businessId,
      leadId: lead.id,
      title: `${lead.status === "contacted" ? "Continue follow-up with" : "Contact"} ${lead.visitorName}`,
      businessName: data.businessById.get(lead.businessId)?.name || "Unknown business",
      dueLabel: formatDate(lead.createdAt),
      status: "open",
      source: "lead",
    }));
}

function TaskSourceBadge({ source }: { source: UiTask["source"] }) {
  const label =
    source === "firestore" ? "Saved" : source === "lead" ? "Lead" : "Manual";

  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "urgent"
      ? "bg-red-300 text-slate-950"
      : priority === "high"
        ? "bg-yellow-300 text-slate-950"
        : "bg-cyan-300/15 text-cyan-200";

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${tone}`}>
      {priority}
    </span>
  );
}