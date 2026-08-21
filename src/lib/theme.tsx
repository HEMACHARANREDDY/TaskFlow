import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeChoice = "light" | "dark" | "system";

type ThemeValue = {
  theme: ThemeChoice;
  resolved: "light" | "dark";
  setTheme: (t: ThemeChoice) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = "taskflow-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as ThemeChoice | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    const apply = () => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const next = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
      setResolved(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = (t: ThemeChoice) => {
    window.localStorage.setItem(KEY, t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolved,
        setTheme,
        toggle: () => setTheme(resolved === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
