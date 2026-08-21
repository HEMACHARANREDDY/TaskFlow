import { supabase } from "@/integrations/supabase/client";
import { fetchAnalyticsRows, type AnalyticsRow } from "./tasks";

export type Analytics = {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  priority: Record<string, number>;
  weekly: { day: string; completed: number }[];
  prev_week_completed: number;
  trend: { day: string; completed: number }[];
};

export async function fetchAnalytics(): Promise<Analytics> {
  // 1. Try Supabase RPC first if available
  try {
    const { data, error } = await supabase.rpc("task_analytics");
    if (!error && data && typeof data === "object") {
      const raw = data as Partial<Analytics>;
      return {
        total: raw.total ?? 0,
        todo: raw.todo ?? 0,
        in_progress: raw.in_progress ?? 0,
        done: raw.done ?? 0,
        overdue: raw.overdue ?? 0,
        priority: raw.priority ?? {},
        weekly: raw.weekly ?? [],
        prev_week_completed: raw.prev_week_completed ?? 0,
        trend: raw.trend ?? [],
      };
    }
  } catch {
    // Fall back to client-side aggregation
  }

  // 2. Fallback: Aggregate directly from task rows
  try {
    const rows = await fetchAnalyticsRows();
    return computeAnalyticsFromRows(rows);
  } catch {
    // 3. Graceful fallback for brand new or empty workspaces
    return computeAnalyticsFromRows([]);
  }
}

export function computeAnalyticsFromRows(rows: AnalyticsRow[]): Analytics {
  const total = rows.length;
  const todo = rows.filter((r) => r.status === "todo").length;
  const in_progress = rows.filter((r) => r.status === "in_progress").length;
  const done = rows.filter((r) => r.status === "done").length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue = rows.filter(
    (r) => r.status !== "done" && r.due_date && r.due_date < todayStr,
  ).length;

  const priority: Record<string, number> = {
    low: rows.filter((r) => r.priority === "low").length,
    medium: rows.filter((r) => r.priority === "medium").length,
    high: rows.filter((r) => r.priority === "high").length,
  };

  // Weekly completions (last 7 days)
  const weekly: { day: string; completed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDay = d.toISOString().slice(0, 10);

    const count = rows.filter((r) => {
      if (r.status !== "done") return false;
      const completedDay = r.completed_at ? r.completed_at.slice(0, 10) : r.created_at.slice(0, 10);
      return completedDay === isoDay;
    }).length;

    weekly.push({ day: isoDay, completed: count });
  }

  // 30-day cumulative trend
  const trend: { day: string; completed: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDay = d.toISOString().slice(0, 10);

    const count = rows.filter((r) => {
      if (r.status !== "done") return false;
      const completedDay = r.completed_at ? r.completed_at.slice(0, 10) : r.created_at.slice(0, 10);
      return completedDay === isoDay;
    }).length;

    trend.push({ day: isoDay, completed: count });
  }

  return {
    total,
    todo,
    in_progress,
    done,
    overdue,
    priority,
    weekly,
    prev_week_completed: 0,
    trend,
  };
}

export function completionRate(a: Analytics) {
  return a.total === 0 ? 0 : Math.round((a.done / a.total) * 100);
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function buildInsights(a: Analytics, _highPriorityOpen: number): string[] {
  const out: string[] = [];
  const thisWeek = a.weekly.reduce((s, d) => s + d.completed, 0);
  out.push(
    thisWeek === 0
      ? "No tasks completed in the last 7 days — a small win today will start your streak."
      : `You completed ${thisWeek} task${thisWeek === 1 ? "" : "s"} in the last 7 days.`,
  );

  const best = [...a.weekly].sort((x, y) => y.completed - x.completed)[0];
  if (best && best.completed > 0) {
    const name = DAY_NAMES[new Date(`${best.day}T00:00:00`).getDay()];
    out.push(`${name} was your most productive day with ${best.completed} completed.`);
  }

  if (a.total > 0) {
    out.push(`${completionRate(a)}% of all tasks are completed across your workspace.`);
  }

  return out;
}

export function dueLabel(task: { due_date?: string | null; status?: string }): {
  text: string;
  tone: "danger" | "warn" | "muted";
} | null {
  if (task.status === "done") return null;
  const dateStr = task.due_date;
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, tone: "danger" };
  if (diffDays === 0) return { text: "Due today", tone: "warn" };
  if (diffDays === 1) return { text: "Due tomorrow", tone: "warn" };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, tone: "muted" };
  return {
    text: target.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tone: "muted",
  };
}
