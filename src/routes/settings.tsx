import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TaskFlow" },
      {
        name: "description",
        content: "Manage your TaskFlow profile, appearance preferences and account session.",
      },
      { property: "og:title", content: "Settings — TaskFlow" },
      {
        property: "og:description",
        content: "Manage your TaskFlow profile, appearance preferences and account session.",
      },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
  }, [profile?.name]);

  const save = async () => {
    if (!user) return;
    if (name.trim().length < 2) {
      toast.error("Your name needs at least 2 characters.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Your profile could not be updated.");
      return;
    }
    await refreshProfile();
    toast.success("Profile updated.");
  };

  return (
    <AppShell title="Settings">
      <header>
        <p className="eyebrow text-muted-foreground">Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
      </header>

      <section className="mt-10 max-w-xl rounded-xl border border-border bg-card p-6">
        <SectionTitle>Profile</SectionTitle>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </section>

      <section className="mt-6 max-w-xl rounded-xl border border-border bg-card p-6">
        <SectionTitle>Theme</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                theme === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 max-w-xl rounded-xl border border-border bg-card p-6">
        <SectionTitle>Account</SectionTitle>
        <p className="text-sm text-muted-foreground">Signed in as {user?.email}.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            await signOut();
            toast.success("Signed out.");
            void navigate({ to: "/" });
          }}
        >
          Logout
        </Button>
      </section>
    </AppShell>
  );
}
