import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  taskSchema,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];
const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TaskFormDrawer({
  open,
  task,
  onClose,
  onSubmit,
}: {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}) {
  const [values, setValues] = useState<TaskInput>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      task
        ? {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date ?? "",
          }
        : { title: "", description: "", status: "todo", priority: "medium", due_date: "" },
    );
  }, [open, task]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = taskSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={task ? "Edit task" : "Create a new task"}
            className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card p-6 sm:p-8"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow text-muted-foreground">{task ? "Edit" : "New"}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {task ? "Edit this task" : "Create a new task"}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-8 flex flex-1 flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                  placeholder="Prepare hackathon presentation"
                />
                {errors["title"] ? (
                  <p className="text-xs text-destructive">{errors["title"]}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={values.description ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
                  placeholder="What does done look like?"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Chip
                      key={s.value}
                      active={values.status === s.value}
                      onClick={() => setValues((v) => ({ ...v, status: s.value }))}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => (
                    <Chip
                      key={p.value}
                      active={values.priority === p.value}
                      onClick={() => setValues((v) => ({ ...v, priority: p.value }))}
                    >
                      {p.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  value={values.due_date ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
                />
              </div>

              <div className="mt-auto flex gap-3 pt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Saving…" : task ? "Save changes" : "Create task"}
                </Button>
              </div>
            </form>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Chip({
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
      type="button"
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
