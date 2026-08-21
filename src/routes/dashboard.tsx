import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CircleDot, ListChecks, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  BlockSkeleton,
  ListSkeleton,
  ProgressRing,
  SectionTitle,
  StatCard,
} from "@/components/primitives";
import { EmptyState } from "@/components/empty-state";
import { PlanningIllustration, ChartIllustration } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { buildInsights, completionRate, dueLabel, fetchAnalytics } from "@/lib/analytics";
import { listTasks, seedDemoTasks } from "@/lib/tasks";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TaskFlow" },
      {
        name: "description",
        content:
          "See today's focus, your completion rate and this week's productivity at a glance.",
      },
      { property: "og:title", content: "Dashboard — TaskFlow" },
      {
        property: "og:description",
        content:
          "See today's focus, your completion rate and this week's productivity at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    enabled: !!user,
  });
  const focusQuery = useQuery({
    queryKey: ["focus"],
    queryFn: () => listTasks({ status: "all", sort: "priority", limit: 5 }),
    enabled: !!user,
  });

  const a = analyticsQuery.data;
  const openTasks = (focusQuery.data?.tasks ?? []).filter((t) => t.status !== "done");
  const focus = openTasks[0];
  const rate = a ? completionRate(a) : 0;
  const highOpen = openTasks.filter((t) => t.priority === "high").length;
  const insights = a ? buildInsights(a, highOpen) : [];
  const todayCompleted = a?.weekly.at(-1)?.completed ?? 0;

  const weekly = (a?.weekly ?? []).map((d) => ({
    day: new Date(`${d.day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    completed: d.completed,
  }));

  const seed = async () => {
    if (!user) return;
    try {
      await seedDemoTasks(user.id);
      toast.success("Demo workspace created.");
      await Promise.all([analyticsQuery.refetch(), focusQuery.refetch()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const loading = analyticsQuery.isLoading || focusQuery.isLoading;
  const failed = analyticsQuery.isError || focusQuery.isError;

  return (
    <AppShell title="Dashboard">
      <header>
        <p className="eyebrow text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {greeting()}, {profile?.name || "there"}.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Here's what your productivity looks like today.
        </p>
      </header>

      {failed ? (
        <p className="mt-10 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load your workspace right now. Please try again.
        </p>
      ) : loading ? (
        <div className="mt-10 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlockSkeleton key={i} className="h-28" />
            ))}
          </div>
          <BlockSkeleton className="h-64" />
          <ListSkeleton rows={2} />
        </div>
      ) : a && a.total === 0 ? (
        <div className="mt-12">
          <EmptyState
            illustration={<PlanningIllustration />}
            title="Your workspace is clear."
            description="Create your first task and start making progress, or load a realistic demo workspace to explore TaskFlow."
            actionLabel="Create your first task"
            onAction={() => void navigate({ to: "/tasks" })}
            secondaryLabel="Load demo tasks"
            onSecondary={seed}
          />
        </div>
      ) : a ? (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total tasks"
              value={a.total}
              icon={<ListChecks className="h-4 w-4" />}
            />
            <StatCard label="Completed" value={a.done} icon={<CircleDot className="h-4 w-4" />} />
            <StatCard
              label="In progress"
              value={a.in_progress}
              icon={<Timer className="h-4 w-4" />}
            />
            <StatCard label="Pending" value={a.todo} icon={<AlertTriangle className="h-4 w-4" />} />
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
              <SectionTitle>Your productivity</SectionTitle>
              <div className="flex items-center gap-6">
                <ProgressRing value={rate} />
                <div>
                  <p className="text-sm font-medium">
                    {rate >= 70
                      ? "You're making great progress."
                      : rate >= 35
                        ? "Steady progress this cycle."
                        : "Time to build momentum."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {a.done} of {a.total} tasks completed.
                  </p>
                  <div className="mt-4 w-28 overflow-hidden rounded-xl border border-border bg-surface">
                    <ChartIllustration />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-3">
              <SectionTitle hint="Completed per day">This week</SectionTitle>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6 lg:col-span-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-muted-foreground">Focus for today</p>
                  {focus ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 capitalize">
                      {focus.priority} priority
                    </span>
                  ) : null}
                </div>
                {focus ? (
                  <>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {focus.title}
                    </h3>
                    {focus.description ? (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {focus.description}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        🗓️ {dueLabel(focus)?.text ?? "No due date"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · Status: {focus.status.replace("_", " ")}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Everything is done. Enjoy the clear runway or plan your next goal.
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Button asChild className="font-semibold shadow-sm">
                  <Link to="/tasks">Open task manager</Link>
                </Button>
              </div>
            </motion.div>

            <PomodoroTimer currentTaskTitle={focus?.title} />
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="eyebrow text-muted-foreground">Quick progress</p>
              <dl className="mt-5 space-y-4 text-sm">
                <Row label="Completed today" value={String(todayCompleted)} />
                <Row
                  label="Weekly completion"
                  value={`${a.weekly.reduce((s, d) => s + d.completed, 0)} tasks`}
                />
                <Row label="Overdue" value={String(a.overdue)} />
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 md:col-span-2">
              <SectionTitle>Productivity Insights</SectionTitle>
              <ul className="mt-4 space-y-3">
                {insights.map((i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-relaxed">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
