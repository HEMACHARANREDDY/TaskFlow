import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ListSkeleton } from "@/components/primitives";
import { EmptyState } from "@/components/empty-state";
import { SearchingIllustration, CelebrateIllustration } from "@/components/illustrations";
import { TaskCard } from "@/components/task-card";
import { TaskFormDrawer } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import {
  createTask,
  deleteTask,
  listTasks,
  seedDemoTasks,
  updateStatus,
  updateTask,
  type SortKey,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks — TaskFlow" },
      {
        name: "description",
        content: "Search, filter, sort and manage every task in your TaskFlow workspace.",
      },
      { property: "og:title", content: "My Tasks — TaskFlow" },
      {
        property: "og:description",
        content: "Search, filter, sort and manage every task in your TaskFlow workspace.",
      },
    ],
  }),
  component: TasksPage,
});

const STATUS_FILTERS: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
const PRIORITY_FILTERS: { value: TaskPriority | "all"; label: string }[] = [
  { value: "all", label: "Any priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "due", label: "Due date" },
  { value: "priority", label: "Priority" },
];

const LIMIT = 6;

function TasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const key = ["tasks", { search, status, priority, sort, page }] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => listTasks({ search, status, priority, sort, page, limit: LIMIT }),
    enabled: !!user,
  });

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["tasks"] });
    await qc.invalidateQueries({ queryKey: ["analytics"] });
    await qc.invalidateQueries({ queryKey: ["focus"] });
  };

  const guard = async (fn: () => Promise<void>, success: string) => {
    try {
      await fn();
      toast.success(success);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  };

  const submitTask = async (input: TaskInput) => {
    if (!user) return;
    const editing = drawer.task;
    await guard(
      () => (editing ? updateTask(editing.id, input) : createTask(user.id, input)),
      editing ? "Task updated." : "Task created successfully.",
    );
    setDrawer({ open: false, task: null });
  };

  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const tasks = query.data?.tasks ?? [];
  const filtered = search || status !== "all" || priority !== "all";

  return (
    <AppShell
      title="My Tasks"
      search={search}
      onSearchChange={(v) => {
        setSearch(v);
        setPage(1);
      }}
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My Tasks</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {total} task{total === 1 ? "" : "s"} in view
          </p>
        </div>
        <Button onClick={() => setDrawer({ open: true, task: null })}>
          <Plus className="mr-1 h-4 w-4" /> New Task
        </Button>
      </header>

      <div className="mt-6 sm:hidden">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search tasks..."
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-y border-border py-3">
        {STATUS_FILTERS.map((f) => (
          <Pill
            key={f.value}
            active={status === f.value}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {f.label}
          </Pill>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value as TaskPriority | "all");
            setPage(1);
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
        >
          {PRIORITY_FILTERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <ListSkeleton rows={4} />
        ) : query.isError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Unable to load your tasks. Please try again.
          </p>
        ) : tasks.length === 0 ? (
          filtered ? (
            <EmptyState
              illustration={<SearchingIllustration />}
              title="No tasks match those filters."
              description="Try a different search term, or clear the filters to see everything in your workspace."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch("");
                setStatus("all");
                setPriority("all");
                setPage(1);
              }}
            />
          ) : (
            <EmptyState
              illustration={<CelebrateIllustration />}
              title="Your workspace is clear."
              description="Create your first task and start making progress, or load a realistic demo workspace."
              actionLabel="Create your first task"
              onAction={() => setDrawer({ open: true, task: null })}
              secondaryLabel="Load demo tasks"
              onSecondary={() =>
                user && guard(() => seedDemoTasks(user.id), "Demo workspace created.")
              }
            />
          )
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={(t) =>
                    guard(
                      () => updateStatus(t.id, t.status === "done" ? "todo" : "done"),
                      t.status === "done" ? "Task reopened." : "Task marked as complete.",
                    )
                  }
                  onEdit={(t) => setDrawer({ open: true, task: t })}
                  onDelete={(t) => setPendingDelete(t)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "h-8 w-8 rounded-md border text-sm transition-colors",
                page === i + 1
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <TaskFormDrawer
        open={drawer.open}
        task={drawer.task}
        onClose={() => setDrawer({ open: false, task: null })}
        onSubmit={submitTask}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const t = pendingDelete;
                setPendingDelete(null);
                if (t) void guard(() => deleteTask(t.id), "Task deleted.");
              }}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}
