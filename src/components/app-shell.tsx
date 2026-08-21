import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListChecks },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0 rounded-lg shadow-sm" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#18181b" />
        <path
          d="M7 10c3.5-1.5 10.5-1.5 14 0"
          stroke="#facc15"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M7 15c2.5-1 7-1 9.5 0"
          stroke="#facc15"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M7 20c2-.7 4-.9 5.5-.5"
          stroke="#facc15"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M16 20l2.2 2.5 4.8-6.5"
          stroke="#facc15"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span>TaskFlow</span>
    </Link>
  );
}

export function AppShell({
  title,
  children,
  search,
  onSearchChange,
}: {
  title: string;
  children: ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { user, profile, loading, signOut } = useAuth();
  const { resolved, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
    if (!loading) setReady(true);
  }, [loading, user, navigate]);

  if (loading || !user || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
          Preparing your workspace…
        </div>
      </div>
    );
  }

  const initials = (profile?.name || user.email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface px-5 py-6 lg:flex">
        <Logo />
        <p className="eyebrow mt-8 px-3 text-muted-foreground">Workspace</p>
        <nav className="mt-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.to
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-3 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-medium">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.name || "You"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              toast.success("Signed out.");
              void navigate({ to: "/" });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-8">
          <h1 className="text-sm font-medium lg:text-base">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            {onSearchChange ? (
              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search tasks..."
                  className="h-9 w-56 pl-9"
                />
              </div>
            ) : null}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-xs font-medium">
              {initials}
            </span>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-8 lg:pb-16"
        >
          {children}
        </motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[11px]",
              pathname === item.to ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
