/**
 * UiZera Platform — Cloud Functions
 *
 * Responsibilities:
 *  1. onAuthUserCreated  — provision the users/ + leaderboard/ documents and
 *     bootstrap super-admin custom claims from the SUPER_ADMIN_EMAILS env.
 *  2. syncLeaderboard    — mirror public-safe fields from users/{uid} into
 *     leaderboard/{uid} whenever a user document changes (single source of
 *     truth stays private; the mirror never contains emails).
 *  3. weeklyReset        — zero weekly coin counters every Monday 00:00 IST.
 *  4. monthlyReset       — zero monthly counters on the 1st, 00:05 IST.
 *
 * All coin awards happen in the Next.js server API inside Firestore
 * transactions; these functions never grant coins.
 */

import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as functionsV1 from "firebase-functions/v1";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

initializeApp();
const db = getFirestore();

const REGION = "asia-south1";
const TIMEZONE = "Asia/Kolkata";

/** Level curve: level n requires 100 * n^2 lifetime XP. */
function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ── 1. Provision user documents on first sign-in ────────────────────────────
export const onAuthUserCreated = functionsV1
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const email = (user.email ?? "").toLowerCase();
    const isSuperAdmin = superAdminEmails().includes(email);
    const role = isSuperAdmin ? "super_admin" : "student";

    if (isSuperAdmin) {
      await getAuth().setCustomUserClaims(user.uid, { role });
      logger.info("Bootstrapped super admin", { uid: user.uid });
    }

    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();
    if (snap.exists) return;

    await userRef.set({
      uid: user.uid,
      email,
      displayName: user.displayName ?? email.split("@")[0] ?? "Member",
      photoURL: user.photoURL ?? null,
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

    await db.collection("auditLogs").add({
      actorUid: "system",
      actorEmail: "system",
      action: "user.created",
      target: user.uid,
      details: { email, role },
      createdAt: FieldValue.serverTimestamp(),
    });
  });

// ── 2. Mirror users → public leaderboard ────────────────────────────────────
export const syncLeaderboard = onDocumentWritten(
  { document: "users/{uid}", region: REGION },
  async (event) => {
    const uid = event.params.uid;
    const after = event.data?.after;

    if (!after?.exists) {
      await db.collection("leaderboard").doc(uid).delete();
      return;
    }

    const u = after.data() as Record<string, unknown>;
    if (u.disabled === true) {
      await db.collection("leaderboard").doc(uid).delete();
      return;
    }

    const xp = typeof u.xp === "number" ? u.xp : 0;

    // Public-safe mirror only — never copy email/regNo/role into this doc.
    await db.collection("leaderboard").doc(uid).set(
      {
        uid,
        displayName: u.displayName ?? "Member",
        photoURL: u.photoURL ?? null,
        department: u.department ?? null,
        year: u.year ?? null,
        coins: typeof u.coins === "number" ? u.coins : 0,
        weeklyCoins: typeof u.weeklyCoins === "number" ? u.weeklyCoins : 0,
        monthlyCoins: typeof u.monthlyCoins === "number" ? u.monthlyCoins : 0,
        xp,
        level: levelForXp(xp),
        badges: Array.isArray(u.badges) ? u.badges : [],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);

// ── 3 & 4. Scheduled counter resets ─────────────────────────────────────────
async function resetCounter(field: "weeklyCoins" | "monthlyCoins") {
  const pageSize = 300;
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let total = 0;

  // Paginate to stay under the 500-writes-per-batch limit at any scale.
  for (;;) {
    let q = db
      .collection("users")
      .orderBy("__name__")
      .limit(pageSize);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((doc) => batch.update(doc.ref, { [field]: 0 }));
    await batch.commit();

    total += snap.size;
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }

  await db.collection("auditLogs").add({
    actorUid: "system",
    actorEmail: "system",
    action: `reset.${field}`,
    target: "users",
    details: { usersReset: total, at: Timestamp.now() },
    createdAt: FieldValue.serverTimestamp(),
  });
  logger.info(`Reset ${field} for ${total} users`);
}

export const weeklyReset = onSchedule(
  { schedule: "0 0 * * 1", timeZone: TIMEZONE, region: REGION },
  async () => resetCounter("weeklyCoins")
);

export const monthlyReset = onSchedule(
  { schedule: "5 0 1 * *", timeZone: TIMEZONE, region: REGION },
  async () => resetCounter("monthlyCoins")
);
