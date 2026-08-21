import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app-shell";
import { AuthIllustration } from "@/components/illustrations";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TaskFlow" },
      {
        name: "description",
        content:
          "Sign in or create your TaskFlow account to plan work and track your productivity.",
      },
      { property: "og:title", content: "Sign in — TaskFlow" },
      {
        property: "og:description",
        content:
          "Sign in or create your TaskFlow account to plan work and track your productivity.",
      },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = loginSchema
  .extend({
    name: z.string().trim().min(2, "Tell us your name."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

function AuthPage() {
  const { signIn, signUp, signInWithGoogle, signInWithGoogleProfile, user, loading } = useAuth();
  const { resolved, toggle } = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    setBusy(true);
    const googleObj = (
      window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (cfg: unknown) => { requestAccessToken: () => void };
            };
          };
        };
      }
    ).google;

    if (googleObj?.accounts?.oauth2) {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: "283041959943-khp0prjf4jlcubrmcf5fbjfohpcl43p1.apps.googleusercontent.com",
        scope: "email profile openid",
        callback: async (tokenRes: { access_token?: string }) => {
          if (tokenRes.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenRes.access_token}` },
              });
              const gUser = (await res.json()) as {
                sub: string;
                name?: string;
                email?: string;
                picture?: string;
              };

              await signInWithGoogleProfile({
                sub: gUser.sub,
                name: gUser.name,
                email: gUser.email,
                picture: gUser.picture,
              });
              toast.success(`Welcome back, ${gUser.name || "User"}!`);
              void navigate({ to: "/dashboard" });
            } catch {
              toast.error("Google login failed. Please try again.");
            } finally {
              setBusy(false);
            }
          } else {
            setBusy(false);
          }
        },
      });
      client.requestAccessToken();
    } else {
      void signInWithGoogle().catch((err) => {
        toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
        setBusy(false);
      });
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const schema = mode === "login" ? loginSchema : signupSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(form.email, form.password);
        toast.success("Welcome back.");
      } else {
        await signUp(form.name, form.email, form.password);
        toast.success("Account created. Welcome to TaskFlow.");
      }
      void navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center"
        >
          <p className="eyebrow text-muted-foreground">
            {mode === "login" ? "Welcome back" : "Get started"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {mode === "login" ? "Sign in to TaskFlow" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Pick up exactly where you left off."
              : "A calm workspace for planning and progress."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" ? (
              <Field label="Name" error={errors["name"]}>
                <Input
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Charan"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field label="Email" error={errors["email"]}>
              <Input
                value={form.email}
                onChange={set("email")}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" error={errors["password"]}>
              <div className="relative">
                <Input
                  value={form.password}
                  onChange={set("password")}
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {mode === "signup" ? (
              <Field label="Confirm password" error={errors["confirm"]}>
                <Input
                  value={form.confirm}
                  onChange={set("confirm")}
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                />
              </Field>
            ) : null}

            {mode === "login" ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 accent-[var(--primary)]"
                />
                Remember me
              </label>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-border bg-card text-foreground font-medium transition-all hover:bg-muted"
            disabled={busy}
            onClick={handleGoogleLogin}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            {mode === "login" ? "New to TaskFlow?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setErrors({});
                setMode(mode === "login" ? "signup" : "login");
              }}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <Link to="/" className="mt-8 text-xs text-muted-foreground underline underline-offset-4">
            Back to home
          </Link>
        </motion.div>
      </div>

      <div className="relative hidden items-center justify-center border-l border-border bg-surface lg:flex">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative w-[26rem] px-8">
          <div className="bento-card p-2">
            <AuthIllustration className="aspect-[4/3] rounded-xl" />
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            “Plan the work, then work the plan.” TaskFlow keeps both in one calm place.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
