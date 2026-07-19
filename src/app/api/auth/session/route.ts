import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/admin";
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

export const runtime = "nodejs";

const bodySchema = z.object({
  idToken: z.string().min(1).max(4096),
});

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * POST /api/auth/session — exchange a fresh Google ID token for an httpOnly
 * session cookie. Also provisions the Firestore user document on first login
 * (fallback for environments where the auth Cloud Function is not deployed)
 * and bootstraps super-admin roles from the SUPER_ADMIN_EMAILS allowlist.
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

    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const snap = await userRef.get();
    const isSuperAdmin = superAdminEmails().includes(email);

    if (!snap.exists) {
      const role = isSuperAdmin ? "super_admin" : "student";
      await userRef.set({
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
        badges: [],
        quizzesTaken: 0,
        challengesApproved: 0,
        certsCompleted: 0,
        disabled: false,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
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
      const data = snap.data()!;
      if (data.disabled === true) {
        throw new ApiError(403, "This account has been disabled.");
      }
      // Heal the super-admin claim if the allowlist changed after signup.
      if (isSuperAdmin && data.role !== "super_admin") {
        await userRef.update({ role: "super_admin" });
        await auth.setCustomUserClaims(decoded.uid, { role: "super_admin" });
      }
      await userRef.update({
        lastLoginAt: FieldValue.serverTimestamp(),
        photoURL: decoded.picture ?? data.photoURL ?? null,
      });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const res = jsonOk({ signedIn: true });
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
        // Already invalid — clearing the cookie below is enough.
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
