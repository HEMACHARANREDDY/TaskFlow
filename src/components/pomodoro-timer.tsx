import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Flame, Coffee, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "short_break" | "long_break";

const DURATIONS: Record<TimerMode, { label: string; seconds: number; icon: typeof Flame }> = {
  focus: { label: "Focus (25m)", seconds: 25 * 60, icon: Flame },
  short_break: { label: "Short Break (5m)", seconds: 5 * 60, icon: Coffee },
  long_break: { label: "Long Break (15m)", seconds: 15 * 60, icon: Sparkles },
};

const POMODORO_COUNT_KEY = "taskflow_pomodoro_sessions";

export function PomodoroTimer({ currentTaskTitle }: { currentTaskTitle?: string | undefined }) {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.focus.seconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = localStorage.getItem(POMODORO_COUNT_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const totalTime = DURATIONS[mode].seconds;
  const progressPercent = Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100));

  // Circular progress ring calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsRunning(false);

            if (mode === "focus") {
              const newCount = sessionsCompleted + 1;
              setSessionsCompleted(newCount);
              localStorage.setItem(POMODORO_COUNT_KEY, String(newCount));
              toast.success("🎉 Focus session completed! Great job. Take a short break.");
              setMode("short_break");
              return DURATIONS.short_break.seconds;
            } else {
              toast.success("☕ Break finished! Ready to focus again?");
              setMode("focus");
              return DURATIONS.focus.seconds;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode, sessionsCompleted]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode].seconds);
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[mode].seconds);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <p className="eyebrow text-muted-foreground font-semibold">Pomodoro Focus Mode</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-surface px-2.5 py-1 rounded-full border border-border">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>{sessionsCompleted} completed</span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex rounded-lg bg-surface p-1 border border-border">
          {(["focus", "short_break", "long_break"] as TimerMode[]).map((m) => {
            const Icon = DURATIONS[m].icon;
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm font-semibold border border-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m === "focus" ? "Focus" : m === "short_break" ? "Short" : "Long"}</span>
              </button>
            );
          })}
        </div>

        {/* Radial Timer Progress */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-muted/30"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="var(--primary, #facc15)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {formattedTime}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                {mode === "focus" ? "Deep Work" : "Rest & Recharge"}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentTaskTitle && mode === "focus" ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 text-center px-4 max-w-xs"
              >
                <p className="text-xs text-muted-foreground truncate">
                  Focusing on: <strong className="text-foreground">{currentTaskTitle}</strong>
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={toggleTimer}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-10 font-semibold shadow-sm transition-all",
            isRunning
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          <span>{isRunning ? "Pause Session" : "Start Focus"}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          aria-label="Reset Timer"
          className="h-10 w-10 border-border hover:bg-surface"
        >
          <RotateCcw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}
