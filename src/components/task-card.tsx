import { motion } from "motion/react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";
import { PriorityBadge, StatusBadge } from "@/components/primitives";
import { dueLabel } from "@/lib/analytics";

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const done = task.status === "done";
  const due = dueLabel(task);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(task)}
          aria-label={done ? "Mark as todo" : "Mark as done"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-foreground/50",
          )}
        >
          <motion.span
            initial={false}
            animate={{ scale: done ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Check className="h-3.5 w-3.5" />
          </motion.span>
        </button>

        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate font-medium transition-colors",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </h3>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {due ? (
              <span
                className={cn(
                  "text-xs",
                  due.tone === "danger" && "font-medium text-destructive",
                  due.tone === "warn" && "font-medium text-warning",
                  due.tone === "muted" && "text-muted-foreground",
                )}
              >
                {due.text}
              </span>
            ) : null}
            {done && task.completed_at ? (
              <span className="text-xs text-muted-foreground">
                Completed{" "}
                {new Date(task.completed_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            aria-label="Delete task"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
