"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { clientAuth, googleProvider } from "@/lib/firebase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  /** Cloudflare D1 profile (coins, role, badges). Null until loaded / signed out. */
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  /** True for quiz_host, admin, and super_admin — can access the /host portal. */
  isHost: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Minimal profile derived from the Firebase auth user.
 */
function fallbackProfile(fb: FirebaseUser): AppUser {
  return {
    uid: fb.uid,
    email: fb.email ?? "",
    displayName: fb.displayName ?? fb.email?.split("@")[0] ?? "Member",
    photoURL: fb.photoURL,
    role: "student",
    department: null,
    year: null,
    regNo: null,
    bio: null,
    coins: 0,
    weeklyCoins: 0,
    monthlyCoins: 0,
    xp: 0,
    level: 1,
    badges: [],
    quizzesTaken: 0,
    challengesApproved: 0,
    certsCompleted: 0,
    disabled: false,
    createdAt: null,
    lastLoginAt: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncSessionWithD1 = useCallback(async (fbUser: FirebaseUser): Promise<AppUser | null> => {
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: boolean; data?: { user?: AppUser } }
        | null;
      if (body?.ok && body.data?.user) {
        return body.data.user;
      }
    } catch (err) {
      console.error("Session sync error:", err);
    }
    return null;
  }, []);

  const hydrateProfile = useCallback(async (fbUser: FirebaseUser) => {
    try {
      // 1. Try reading the existing session profile from D1
      const res = await fetch("/api/profile");
      const body = (await res.json().catch(() => null)) as
        | { ok: boolean; data?: { user?: AppUser } }
        | null;
      if (body?.ok && body.data?.user) {
        setUser(body.data.user);
        setLoading(false);
        return;
      }
    } catch {
      // Profile fetch failed, will try token exchange
    }

    // 2. If session cookie missing or expired, sync fresh token to D1
    const syncedUser = await syncSessionWithD1(fbUser);
    if (syncedUser) {
      setUser(syncedUser);
    } else {
      setUser(fallbackProfile(fbUser));
    }
    setLoading(false);
  }, [syncSessionWithD1]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const body = (await res.json().catch(() => null)) as
        | { ok: boolean; data?: { user?: AppUser } }
        | null;
      if (body?.ok && body.data?.user) {
        setUser(body.data.user);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(clientAuth(), (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      } else {
        void hydrateProfile(fbUser);
      }
    });
  }, [hydrateProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(clientAuth(), googleProvider());
      setFirebaseUser(cred.user);

      // Exchange ID token for session cookie & get D1 profile directly
      const syncedUser = await syncSessionWithD1(cred.user);
      if (syncedUser) {
        setUser(syncedUser);
      } else {
        setUser(fallbackProfile(cred.user));
      }
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setLoading(false);
      throw err;
    }
  }, [router, syncSessionWithD1]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    await firebaseSignOut(clientAuth()).catch(() => {});
    queryClient.clear();
    setUser(null);
    setFirebaseUser(null);
    setLoading(false);
    router.push("/");
    router.refresh();
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      isAdmin: user?.role === "admin" || user?.role === "super_admin",
      isHost: user?.role === "quiz_host" || user?.role === "admin" || user?.role === "super_admin",
      signInWithGoogle,
      signOut,
      refreshUser,
    }),
    [firebaseUser, user, loading, signInWithGoogle, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;


}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
