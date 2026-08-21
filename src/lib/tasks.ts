import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const taskSchema = z.object({
  title: z.string().trim().min(3, "Give your task a title of at least 3 characters.").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional().nullable(),
});
export type TaskInput = z.infer<typeof taskSchema>;

export type SortKey = "newest" | "oldest" | "due" | "priority";

export type TaskQuery = {
  search?: string;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  sort?: SortKey;
  page?: number;
  limit?: number;
};

const FIELDS =
  "id,user_id,title,description,status,priority,due_date,completed_at,created_at,updated_at";

const LOCAL_TASKS_KEY = "taskflow_local_tasks";

function getLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LOCAL_TASKS_KEY);
    return saved ? (JSON.parse(saved) as Task[]) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: Task[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  }
}

export async function listTasks(q: TaskQuery): Promise<{ tasks: Task[]; total: number }> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 8;
    let query = supabase.from("tasks").select(FIELDS, { count: "exact" });

    if (q.search?.trim()) {
      const term = q.search.trim().replace(/[%,]/g, "");
      query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }
    if (q.status && q.status !== "all") query = query.eq("status", q.status);
    if (q.priority && q.priority !== "all") query = query.eq("priority", q.priority);

    switch (q.sort ?? "newest") {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "due":
        query = query.order("due_date", { ascending: true, nullsFirst: false });
        break;
      case "priority":
        query = query
          .order("priority", { ascending: false })
          .order("due_date", { ascending: true, nullsFirst: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) {
      return filterLocalTasks(q);
    }
    const serverTasks = (data ?? []) as unknown as Task[];
    if (serverTasks.length === 0) {
      const local = filterLocalTasks(q);
      if (local.tasks.length > 0) return local;
    }
    return { tasks: serverTasks, total: count ?? serverTasks.length };
  } catch {
    return filterLocalTasks(q);
  }
}

function filterLocalTasks(q: TaskQuery): { tasks: Task[]; total: number } {
  let list = getLocalTasks();
  if (q.search?.trim()) {
    const term = q.search.trim().toLowerCase();
    list = list.filter(
      (t) => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term),
    );
  }
  if (q.status && q.status !== "all") {
    list = list.filter((t) => t.status === q.status);
  }
  if (q.priority && q.priority !== "all") {
    list = list.filter((t) => t.priority === q.priority);
  }

  // Sorting
  if (q.sort === "oldest") {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else if (q.sort === "due") {
    list.sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  } else if (q.sort === "priority") {
    const weights = { high: 3, medium: 2, low: 1 };
    list.sort((a, b) => weights[b.priority] - weights[a.priority]);
  } else {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const page = q.page ?? 1;
  const limit = q.limit ?? 8;
  const from = (page - 1) * limit;
  const paginated = list.slice(from, from + limit);

  return { tasks: paginated, total: list.length };
}

export async function createTask(userId: string, input: TaskInput) {
  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    title: input.title,
    description: input.description ?? "",
    status: input.status,
    priority: input.priority,
    due_date: input.due_date || null,
    completed_at: input.status === "done" ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Save locally for instant reactivity
  const local = getLocalTasks();
  saveLocalTasks([newTask, ...local]);

  // 2. Sync to Supabase in background
  try {
    await supabase.from("tasks").insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? "",
      status: input.status,
      priority: input.priority,
      due_date: input.due_date || null,
    });
  } catch (e) {
    console.warn("[Tasks] Supabase create note:", e);
  }
}

export async function updateTask(id: string, input: TaskInput) {
  const local = getLocalTasks();
  const updated = local.map((t) =>
    t.id === id
      ? {
          ...t,
          title: input.title,
          description: input.description ?? "",
          status: input.status,
          priority: input.priority,
          due_date: input.due_date || null,
          completed_at:
            input.status === "done" && !t.completed_at
              ? new Date().toISOString()
              : t.status !== "done"
                ? null
                : t.completed_at,
          updated_at: new Date().toISOString(),
        }
      : t,
  );
  saveLocalTasks(updated);

  try {
    await supabase
      .from("tasks")
      .update({
        title: input.title,
        description: input.description ?? "",
        status: input.status,
        priority: input.priority,
        due_date: input.due_date || null,
      })
      .eq("id", id);
  } catch (e) {
    console.warn("[Tasks] Supabase update note:", e);
  }
}

export async function updateStatus(id: string, status: TaskStatus) {
  const local = getLocalTasks();
  const updated = local.map((t) =>
    t.id === id
      ? {
          ...t,
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }
      : t,
  );
  saveLocalTasks(updated);

  try {
    await supabase.from("tasks").update({ status }).eq("id", id);
  } catch (e) {
    console.warn("[Tasks] Supabase updateStatus note:", e);
  }
}

export async function deleteTask(id: string) {
  const local = getLocalTasks();
  saveLocalTasks(local.filter((t) => t.id !== id));

  try {
    await supabase.from("tasks").delete().eq("id", id);
  } catch (e) {
    console.warn("[Tasks] Supabase delete note:", e);
  }
}

export type AnalyticsRow = Pick<
  Task,
  "id" | "status" | "priority" | "due_date" | "completed_at" | "created_at" | "title"
>;

/** Minimal projection used for all aggregate views. */
export async function fetchAnalyticsRows(): Promise<AnalyticsRow[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,completed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (!error && data && data.length > 0) {
      return data as unknown as AnalyticsRow[];
    }
  } catch {
    // Fall back to local tasks
  }

  const local = getLocalTasks();
  return local.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    completed_at: t.completed_at,
    created_at: t.created_at,
  }));
}

export const DEMO_TASKS: TaskInput[] = [
  {
    title: "Complete portfolio website",
    description: "Polish case studies and ship the new landing page.",
    status: "in_progress",
    priority: "high",
    due_date: offset(2),
  },
  {
    title: "Build authentication API",
    description: "Sessions, password rules and protected routes.",
    status: "done",
    priority: "high",
    due_date: offset(-3),
  },
  {
    title: "Prepare hackathon presentation",
    description: "Slides, demo script and a two minute walkthrough.",
    status: "todo",
    priority: "high",
    due_date: offset(1),
  },
  {
    title: "Fix database indexes",
    description: "Add compound indexes for status and due date lookups.",
    status: "done",
    priority: "medium",
    due_date: offset(-1),
  },
  {
    title: "Design dashboard",
    description: "Editorial layout with productivity ring and weekly chart.",
    status: "done",
    priority: "medium",
    due_date: offset(-2),
  },
  {
    title: "Deploy application",
    description: "Production build, environment checks and smoke test.",
    status: "todo",
    priority: "medium",
    due_date: offset(5),
  },
  {
    title: "Write documentation",
    description: "README, API reference and setup instructions.",
    status: "todo",
    priority: "low",
    due_date: offset(7),
  },
  {
    title: "Review analytics queries",
    description: "Ensure aggregates read from live task data only.",
    status: "in_progress",
    priority: "low",
    due_date: offset(4),
  },
];

function offset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seedDemoTasks(userId: string) {
  const newTasks: Task[] = DEMO_TASKS.map((t, idx) => ({
    id: `demo_${Date.now()}_${idx}`,
    user_id: userId,
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    due_date: t.due_date ?? null,
    completed_at: t.status === "done" ? new Date().toISOString() : null,
    created_at: new Date(Date.now() - idx * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  saveLocalTasks(newTasks);

  const rows = DEMO_TASKS.map((t) => ({
    user_id: userId,
    title: t.title,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    due_date: t.due_date ?? null,
  }));
  try {
    await supabase.from("tasks").insert(rows);
  } catch (e) {
    console.warn("[Tasks] Demo seed Supabase note:", e);
  }
}
