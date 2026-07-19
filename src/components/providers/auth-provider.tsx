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
import { doc, onSnapshot } from "firebase/firestore";
import { clientAuth, clientDb, googleProvider } from "@/lib/firebase/client";
import type { AppUser } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  /** Firestore profile (coins, role, badges). Null until loaded / signed out. */
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Minimal profile derived from the Firebase auth user. Used when the
 * Firestore user document is not yet created (first-login race) or cannot
 * be read, so a signed-in user is never presented as logged-out.
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(clientAuth(), (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;

    // Authoritative fallback: the server reads the profile with the Admin SDK
    // (correct role included) when the client SDK cannot read the users doc.
    const hydrateFromServer = async () => {
      try {
        const res = await fetch("/api/profile");
        const body = (await res.json().catch(() => null)) as
          | { ok: boolean; data?: { user?: AppUser } }
          | null;
        if (!cancelled && body?.ok && body.data?.user) {
          setUser(body.data.user);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to the minimal client-side profile
      }
      if (!cancelled) {
        setUser(fallbackProfile(firebaseUser));
        setLoading(false);
      }
    };

    const ref = doc(clientDb(), "users", firebaseUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setUser({ ...(snap.data() as AppUser), uid: snap.id });
          setLoading(false);
        } else {
          void hydrateFromServer();
        }
      },
      () => void hydrateFromServer()
    );
    return () => {
      cancelled = true;
      unsub();
    };
  }, [firebaseUser]);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(clientAuth(), googleProvider());
    const idToken = await cred.user.getIdToken(true);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      await firebaseSignOut(clientAuth());
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Sign-in failed. Please try again.");
    }
    router.refresh();
  }, [router]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    await firebaseSignOut(clientAuth()).catch(() => {});
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      user,
      loading,
      isAdmin: user?.role === "admin" || user?.role === "super_admin",
      signInWithGoogle,
      signOut,
    }),
    [firebaseUser, user, loading, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
