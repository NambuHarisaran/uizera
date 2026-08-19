import "server-only";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { AppUser, Role } from "@/types";

export interface SessionUser {
  uid: string;
  email: string;
  role: Role;
}

export function isAdminRole(role: Role): boolean {
  return role === "admin" || role === "super_admin";
}

export function isHostRole(role: Role): boolean {
  return role === "quiz_host" || role === "admin" || role === "super_admin";
}

/** Check if email is in the super admin allowlist. */
function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

/**
 * Verify the session cookie and return the caller's identity.
 * Authoritative user and role data is read from Cloudflare D1.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    const email = (decoded.email ?? "").toLowerCase();

    // Query D1 user record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.uid, decoded.uid),
    });

    if (!userRecord) {
      // Auto-provision user in D1 on first login
      const isSuper = isSuperAdminEmail(email);
      const initialRole: Role = isSuper ? "super_admin" : "student";
      const now = Date.now();

      await db.insert(users).values({
        uid: decoded.uid,
        email: email || `${decoded.uid}@user.uizera`,
        displayName: decoded.name ?? email.split("@")[0] ?? "Member",
        photoURL: decoded.picture ?? null,
        role: initialRole,
        createdAt: now,
        lastLoginAt: now,
      });

      return {
        uid: decoded.uid,
        email,
        role: initialRole,
      };
    }

    if (userRecord.disabled) return null;

    // Check if role should be escalated to super_admin from env allowlist
    let role = userRecord.role as Role;
    if (isSuperAdminEmail(email) && role !== "super_admin") {
      role = "super_admin";
      await db.update(users).set({ role }).where(eq(users.uid, decoded.uid));
    }

    return {
      uid: decoded.uid,
      email: (decoded.email ?? userRecord.email ?? "").toLowerCase(),
      role: role ?? "student",
    };
  } catch {
    return null;
  }
}

/** Full profile for the signed-in user from Cloudflare D1. */
export async function getAppUser(): Promise<AppUser | null> {
  const session = await getSessionUser();
  if (!session) return null;

  const userRecord = await db.query.users.findFirst({
    where: eq(users.uid, session.uid),
  });
  if (!userRecord) return null;

  let parsedBadges: string[] = [];
  try {
    parsedBadges = JSON.parse(userRecord.badges ?? "[]");
  } catch {
    parsedBadges = [];
  }

  return {
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName,
    photoURL: userRecord.photoURL,
    role: userRecord.role as Role,
    department: userRecord.department,
    year: userRecord.year,
    regNo: userRecord.regNo,
    bio: userRecord.bio,
    coins: userRecord.coins,
    weeklyCoins: userRecord.weeklyCoins,
    monthlyCoins: userRecord.monthlyCoins,
    xp: userRecord.xp,
    level: userRecord.level,
    badges: parsedBadges,
    quizzesTaken: userRecord.quizzesTaken,
    challengesApproved: userRecord.challengesApproved,
    certsCompleted: userRecord.certsCompleted,
    disabled: Boolean(userRecord.disabled),
    createdAt: userRecord.createdAt,
    lastLoginAt: userRecord.lastLoginAt,
  };
}

