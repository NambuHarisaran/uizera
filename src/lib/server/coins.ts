import "server-only";

import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/server/api";
import { levelForXp } from "@/lib/utils";
import type { AppUser, CoinSource } from "@/types";

interface AwardOptions {
  uid: string;
  /** Positive to award; negative only for admin adjustments. */
  amount: number;
  xpAmount?: number;
  source: CoinSource;
  reason: string;
  refId?: string | null;
  awardedBy: string;
  /** Stat counters to bump atomically alongside the award. */
  counters?: Partial<
    Pick<AppUser, "quizzesTaken" | "challengesApproved" | "certsCompleted">
  >;
  /** Badges granted directly by the caller (e.g. perfect_score). */
  extraBadges?: string[];
}

interface AwardResult {
  newBalance: number;
  newBadges: string[];
}

/** Threshold badges evaluated after every award. */
function thresholdBadges(u: {
  xp: number;
  quizzesTaken: number;
  challengesApproved: number;
  certsCompleted: number;
}): string[] {
  const earned: string[] = [];
  if (u.quizzesTaken >= 1) earned.push("first_quiz");
  if (u.quizzesTaken >= 5) earned.push("quiz_5");
  if (u.quizzesTaken >= 10) earned.push("quiz_10");
  if (u.challengesApproved >= 1) earned.push("first_challenge");
  if (u.challengesApproved >= 5) earned.push("challenge_5");
  if (u.certsCompleted >= 7) earned.push("cert_7");
  if (u.certsCompleted >= 15) earned.push("cert_15");
  if (u.certsCompleted >= 30) earned.push("cert_30");
  if (u.xp >= 100) earned.push("coins_100");
  if (u.xp >= 500) earned.push("coins_500");
  if (u.xp >= 1000) earned.push("coins_1000");
  return earned;
}

/**
 * Bump stat counters and re-evaluate badges WITHOUT touching coins — used for
 * zero-coin outcomes (e.g. a 0-score quiz still counts as taken).
 */
export async function bumpStats(
  uid: string,
  counters: NonNullable<AwardOptions["counters"]>,
  extraBadges: string[] = []
): Promise<void> {
  const db = adminDb();
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;
    const user = snap.data() as AppUser;

    const next = {
      quizzesTaken: (user.quizzesTaken ?? 0) + (counters.quizzesTaken ?? 0),
      challengesApproved:
        (user.challengesApproved ?? 0) + (counters.challengesApproved ?? 0),
      certsCompleted: (user.certsCompleted ?? 0) + (counters.certsCompleted ?? 0),
    };

    const existing = new Set(user.badges ?? []);
    const candidates = [
      ...thresholdBadges({ xp: user.xp ?? 0, ...next }),
      ...extraBadges,
    ];
    const badges = [...existing, ...candidates.filter((b) => !existing.has(b))];

    tx.update(userRef, { ...next, badges });
  });
}

/**
 * Atomically award (or adjust) coins for a user.
 *
 * The ONLY code path in the entire system that changes a coin balance.
 * Runs in a Firestore transaction: balance update, counters, badges, and the
 * append-only ledger entry all commit together or not at all.
 */
export async function awardCoins(opts: AwardOptions): Promise<AwardResult> {
  const amount = Math.trunc(opts.amount);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new ApiError(400, "Invalid coin amount.");
  }
  if (Math.abs(amount) > 10_000) {
    throw new ApiError(400, "Coin amount exceeds the allowed maximum.");
  }
  if (amount < 0 && opts.source !== "admin_adjustment") {
    throw new ApiError(400, "Only admin adjustments may deduct coins.");
  }

  const db = adminDb();
  const userRef = db.collection("users").doc(opts.uid);
  const txRef = db.collection("coinTransactions").doc();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new ApiError(404, "User not found.");
    const user = snap.data() as AppUser;
    if (user.disabled) throw new ApiError(400, "This account is disabled.");

    const coins = Math.max(0, (user.coins ?? 0) + amount);
    const weeklyCoins = Math.max(0, (user.weeklyCoins ?? 0) + amount);
    const monthlyCoins = Math.max(0, (user.monthlyCoins ?? 0) + amount);
    // XP is lifetime-earned: it only ever grows.
    const xpGain = opts.xpAmount !== undefined ? Math.max(0, opts.xpAmount) : Math.max(0, amount);
    const xp = (user.xp ?? 0) + xpGain;
    const level = levelForXp(xp);

    const counters = {
      quizzesTaken: (user.quizzesTaken ?? 0) + (opts.counters?.quizzesTaken ?? 0),
      challengesApproved:
        (user.challengesApproved ?? 0) + (opts.counters?.challengesApproved ?? 0),
      certsCompleted: (user.certsCompleted ?? 0) + (opts.counters?.certsCompleted ?? 0),
    };

    const existing = new Set(user.badges ?? []);
    const candidates = [
      ...thresholdBadges({ xp, ...counters }),
      ...(opts.extraBadges ?? []),
    ];
    const newBadges = candidates.filter((b) => !existing.has(b));
    const badges = [...existing, ...newBadges];

    tx.update(userRef, {
      coins,
      weeklyCoins,
      monthlyCoins,
      xp,
      level,
      badges,
      ...counters,
    });

    tx.set(txRef, {
      uid: opts.uid,
      displayName: user.displayName ?? "Member",
      amount,
      source: opts.source,
      reason: opts.reason.slice(0, 500),
      refId: opts.refId ?? null,
      awardedBy: opts.awardedBy,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { newBalance: coins, newBadges };
  });
}
