import "server-only";

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/constants";
import type { AppUser, Role } from "@/types";

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
}

export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Verify the session cookie and return the caller's identity.
 *
 * The ROLE returned here is read from Firestore (authoritative, updates take
 * effect immediately on promotion/demotion) — not from the cookie's claims,
 * which can lag until the next sign-in. Returns null for missing/invalid/
 * revoked sessions: callers must treat null as signed-out (fail closed).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    // checkRevoked=true: a signed-out-everywhere / disabled account fails here.
    const decoded = await adminAuth().verifySessionCookie(session, true);

    const snap = await adminDb().collection("users").doc(decoded.uid).get();
    if (!snap.exists) return null;
    const data = snap.data() as AppUser;
    if (data.disabled) return null;

    return {
      uid: decoded.uid,
      email: (decoded.email ?? data.email ?? "").toLowerCase(),
      role: data.role ?? "student",
    };
  } catch {
    return null;
  }
}

/** Full profile for the signed-in user, or null. */
export async function getAppUser(): Promise<AppUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const snap = await adminDb().collection("users").doc(session.uid).get();
  if (!snap.exists) return null;
  const user = snap.data() as AppUser;
  return { ...user, uid: session.uid };
}
