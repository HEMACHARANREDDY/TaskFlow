import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { BlockSkeleton, SectionTitle, StatCard } from "@/components/primitives";
import { EmptyState } from "@/components/empty-state";
import { ChartIllustration, SearchingIllustration } from "@/components/illustrations";
import { useAuth } from "@/lib/auth";
import { buildInsights, completionRate, fetchAnalytics } from "@/lib/analytics";
import { listTasks } from "@/lib/tasks";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TaskFlow" },
      {
        name: "description",
        content:
          "Your productivity, visualized: status mix, weekly output, priority balance and completion trend.",
      },
      { property: "og:title", content: "Analytics — TaskFlow" },
      {
        property: "og:description",
        content:
          "Your productivity, visualized: status mix, weekly output, priority balance and completion trend.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
};

function AnalyticsPage() {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["analytics"], queryFn: fetchAnalytics, enabled: !!user });
  const openQ = useQuery({
    queryKey: ["analytics-open-high"],
    queryFn: () => listTasks({ status: "all", priority: "high", sort: "due", limit: 50 }),
    enabled: !!user,
  });

  const a = q.data;
  const highOpen = (openQ.data?.tasks ?? []).filter((t) => t.status !== "done").length;

  const statusData = a
    ? [
        { name: "Todo", value: a.todo },
        { name: "In Progress", value: a.in_progress },
        { name: "Done", value: a.done },
      ].filter((d) => d.value > 0)
    : [];
  const statusColors = ["var(--chart-2)", "var(--chart-4)", "var(--chart-1)"];

  const priorityData = a
    ? (["low", "medium", "high"] as const).map((p) => ({
        name: p[0]!.toUpperCase() + p.slice(1),
        count: a.priority[p] ?? 0,
      }))
    : [];

  const weekly = (a?.weekly ?? []).map((d) => ({
    day: new Date(`${d.day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }),
    completed: d.completed,
  }));

  let running = 0;
  const trend = (a?.trend ?? []).map((d) => {
    running += d.completed;
    return {
      day: new Date(`${d.day}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      total: running,
    };
  });

  return (
    <AppShell title="Analytics">
      <header>
        <p className="eyebrow text-muted-foreground">Insights</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Your productivity, visualized.
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Every number below is calculated from your live task data.
        </p>
      </header>

      {q.isLoading ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <BlockSkeleton className="h-72" />
          <BlockSkeleton className="h-72" />
          <BlockSkeleton className="h-72" />
          <BlockSkeleton className="h-72" />
        </div>
      ) : q.isError ? (
        <p className="mt-10 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Unable to load your analytics. Please try again.
        </p>
      ) : a && a.total === 0 ? (
        <div className="mt-12">
          <EmptyState
            illustration={<SearchingIllustration />}
            title="No data to chart yet."
            description="Create a few tasks and your analytics will build themselves from real activity."
          />
        </div>
      ) : a ? (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total tasks" value={a.total} />
            <StatCard label="Completed" value={a.done} />
            <StatCard label="Pending" value={a.todo + a.in_progress} />
            <StatCard label="Completion rate" value={`${completionRate(a)}%`} />
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <Panel title="Task status distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="var(--card)"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={statusColors[i % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-5 text-xs text-muted-foreground">
                {statusData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: statusColors[i % statusColors.length] }}
                    />
                    {s.name} · {s.value}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel title="Weekly productivity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekly} margin={{ left: -20 }}>
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
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Priority distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ left: -20 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
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
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title="Completion trend" hint="Last 30 days, cumulative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    interval={6}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          </section>

          <section className="mt-10 rounded-xl border border-border bg-surface p-6 sm:p-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SectionTitle>Your productivity insight</SectionTitle>
                <ul className="space-y-3">
                  {buildInsights(a, highOpen).map((i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-48 shrink-0 self-center overflow-hidden rounded-2xl border border-border bg-surface">
                <ChartIllustration />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <SectionTitle {...(hint ? { hint } : {})}>{title}</SectionTitle>
      <div className="h-64">{children}</div>
    </div>
  );
}
