import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { audit } from "@/lib/server/audit";
import { SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/constants";
import type { Role } from "@/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  idToken: z.string().min(1).max(65536),
});


function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * POST /api/auth/session — exchange a fresh Google ID token for an httpOnly
 * session cookie and sync user profile with Cloudflare D1.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    rateLimit(`session:${req.headers.get("x-forwarded-for") ?? "local"}`, {
      limit: 20,
      windowMs: 60_000,
    });

    const { idToken } = await parseBody(req, bodySchema);

    const auth = adminAuth();
    const decoded = await auth.verifyIdToken(idToken, true).catch(() => {
      throw new ApiError(401, "Invalid or expired credential.");
    });

    const email = (decoded.email ?? "").toLowerCase();
    if (!email || decoded.firebase.sign_in_provider !== "google.com") {
      throw new ApiError(401, "Google sign-in is required.");
    }

    const isSuperAdmin = superAdminEmails().includes(email);
    const existingUser = await db.query.users.findFirst({
      where: eq(users.uid, decoded.uid),
    });

    const now = Date.now();

    if (!existingUser) {
      const role: Role = isSuperAdmin ? "super_admin" : "student";
      await db.insert(users).values({
        uid: decoded.uid,
        email,
        displayName: decoded.name ?? email.split("@")[0] ?? "Member",
        photoURL: decoded.picture ?? null,
        role,
        department: null,
        year: null,
        regNo: null,
        bio: null,
        coins: 0,
        weeklyCoins: 0,
        monthlyCoins: 0,
        xp: 0,
        level: 1,
        badges: "[]",
        quizzesTaken: 0,
        challengesApproved: 0,
        certsCompleted: 0,
        disabled: false,
        createdAt: now,
        lastLoginAt: now,
      });

      if (isSuperAdmin) {
        await auth.setCustomUserClaims(decoded.uid, { role: "super_admin" });
      }

      await audit({
        actorUid: decoded.uid,
        actorEmail: email,
        action: "auth.first_login",
        target: decoded.uid,
        details: { role },
      });
    } else {
      if (existingUser.disabled) {
        throw new ApiError(403, "This account has been disabled.");
      }

      let role = existingUser.role as Role;
      if (isSuperAdmin && role !== "super_admin") {
        role = "super_admin";
        await auth.setCustomUserClaims(decoded.uid, { role: "super_admin" });
      }

      await db
        .update(users)
        .set({
          role,
          lastLoginAt: now,
          photoURL: decoded.picture ?? existingUser.photoURL ?? null,
        })
        .where(eq(users.uid, decoded.uid));
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    // Fetch the authoritative updated user profile from D1
    const finalUserRecord = await db.query.users.findFirst({
      where: eq(users.uid, decoded.uid),
    });

    let badges: string[] = [];
    try {
      badges = JSON.parse(finalUserRecord?.badges ?? "[]");
    } catch {}

    const appUser = finalUserRecord
      ? {
          uid: finalUserRecord.uid,
          email: finalUserRecord.email,
          displayName: finalUserRecord.displayName,
          photoURL: finalUserRecord.photoURL,
          role: finalUserRecord.role as Role,
          department: finalUserRecord.department,
          year: finalUserRecord.year,
          regNo: finalUserRecord.regNo,
          bio: finalUserRecord.bio,
          coins: finalUserRecord.coins,
          weeklyCoins: finalUserRecord.weeklyCoins,
          monthlyCoins: finalUserRecord.monthlyCoins,
          xp: finalUserRecord.xp,
          level: finalUserRecord.level,
          badges,
          quizzesTaken: finalUserRecord.quizzesTaken,
          challengesApproved: finalUserRecord.challengesApproved,
          certsCompleted: finalUserRecord.certsCompleted,
          disabled: finalUserRecord.disabled,
          createdAt: finalUserRecord.createdAt ? new Date(finalUserRecord.createdAt) : null,
          lastLoginAt: finalUserRecord.lastLoginAt ? new Date(finalUserRecord.lastLoginAt) : null,
        }
      : null;

    const res = jsonOk({ signedIn: true, user: appUser });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });
    return res;
  });
}


/** DELETE /api/auth/session — sign out and revoke refresh tokens. */
export async function DELETE(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);

    const session = req.cookies.get(SESSION_COOKIE)?.value;
    if (session) {
      try {
        const decoded = await adminAuth().verifySessionCookie(session);
        await adminAuth().revokeRefreshTokens(decoded.uid);
      } catch {
        // Already invalid
      }
    }

    const res = jsonOk({ signedOut: true });
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  });
}

