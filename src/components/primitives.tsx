import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/lib/tasks";
import { Skeleton } from "@/components/ui/skeleton";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; dot: string }> = {
    todo: { label: "Todo", dot: "bg-muted-foreground" },
    in_progress: { label: "In Progress", dot: "bg-warning" },
    done: { label: "Done", dot: "bg-primary" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    low: "text-muted-foreground",
    medium: "text-foreground",
    high: "text-destructive",
  };
  return (
    <span className={cn("text-xs font-medium capitalize", map[priority])}>
      {priority === "high" ? "High priority" : `${priority} priority`}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="eyebrow">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function ProgressRing({ value, size = 132 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--border)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">{value}%</span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-40 w-full rounded-xl", className)} />;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{children}</h2>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
