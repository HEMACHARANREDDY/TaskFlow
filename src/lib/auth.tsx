import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; name: string; email: string };

export type GoogleProfilePayload = {
  sub: string;
  name?: string | undefined;
  email?: string | undefined;
  picture?: string | undefined;
};

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithIdToken: (idToken: string) => Promise<void>;
  signInWithGoogleProfile: (payload: GoogleProfilePayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

const STORAGE_KEY = "taskflow_google_user";
const PROFILE_KEY = "taskflow_user_profile";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [googleUser, setGoogleUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      return saved ? (JSON.parse(saved) as Profile) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
      if (!next && !googleUser) setProfile(null);
    });
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [googleUser]);

  const userId = session?.user.id ?? googleUser?.id ?? null;

  const loadProfile = useMemo(
    () => async (id: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id,name,email")
          .eq("id", id)
          .maybeSingle();
        if (data) {
          setProfile(data as Profile);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        }
      } catch {
        // Retain current profile on network error
      }
    },
    [],
  );

  useEffect(() => {
    if (userId && !profile) void loadProfile(userId);
  }, [userId, profile, loadProfile]);

  const value: AuthValue = {
    user: session?.user ?? googleUser ?? null,
    session,
    profile,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(formatAuthError(error.message));
    },
    async signUp(name, email, password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw new Error(formatAuthError(error.message));
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw new Error(formatAuthError(error.message));
    },
    async signInWithGoogleProfile(gPayload: GoogleProfilePayload) {
      const userObj = {
        id: gPayload.sub || "google-user",
        email: gPayload.email || "",
        user_metadata: {
          name: gPayload.name || gPayload.email?.split("@")[0] || "User",
          avatar_url: gPayload.picture,
        },
        app_metadata: { provider: "google" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      const userProfile: Profile = {
        id: userObj.id,
        name: gPayload.name || gPayload.email?.split("@")[0] || "User",
        email: gPayload.email || "",
      };

      setGoogleUser(userObj);
      setProfile(userProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
    },
    async signInWithIdToken(idToken: string) {
      try {
        const base64Url = idToken.split(".")[1] ?? "";
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const gPayload = JSON.parse(jsonPayload) as GoogleProfilePayload;
        await value.signInWithGoogleProfile(gPayload);
        localStorage.setItem("taskflow_token", idToken);
      } catch (e) {
        console.warn("[Auth] ID token decode note:", e);
      }

      try {
        const { data } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (data.session) {
          setSession(data.session);
        }
      } catch (e) {
        console.warn("[Auth] Supabase sync note:", e);
      }
    },
    async signOut() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem("taskflow_token");
      setGoogleUser(null);
      setProfile(null);
      setSession(null);
      await supabase.auth.signOut().catch(() => {});
    },
    async refreshProfile() {
      if (userId) await loadProfile(userId);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function formatAuthError(message: string): string {
  if (/provider is not enabled|unsupported provider/i.test(message))
    return "Google provider is not enabled in your Supabase Auth settings. Please enable it in the Supabase Dashboard.";
  if (/invalid login credentials/i.test(message))
    return "That email and password combination didn't match.";
  if (/already registered/i.test(message)) return "An account with this email already exists.";
  return message || "Something went wrong. Please try again.";
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
