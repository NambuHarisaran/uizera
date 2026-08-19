import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, coinTransactions } from "@/lib/db/schema";
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
 * Bump stat counters and re-evaluate badges WITHOUT touching coins.
 */
export async function bumpStats(
  uid: string,
  counters: NonNullable<AwardOptions["counters"]>,
  extraBadges: string[] = []
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.uid, uid),
  });
  if (!user) return;

  const next = {
    quizzesTaken: (user.quizzesTaken ?? 0) + (counters.quizzesTaken ?? 0),
    challengesApproved:
      (user.challengesApproved ?? 0) + (counters.challengesApproved ?? 0),
    certsCompleted: (user.certsCompleted ?? 0) + (counters.certsCompleted ?? 0),
  };

  let existingBadges: string[] = [];
  try {
    existingBadges = JSON.parse(user.badges ?? "[]");
  } catch {
    existingBadges = [];
  }

  const existingSet = new Set(existingBadges);
  const candidates = [
    ...thresholdBadges({ xp: user.xp ?? 0, ...next }),
    ...extraBadges,
  ];
  const badges = [...existingSet, ...candidates.filter((b) => !existingSet.has(b))];

  await db
    .update(users)
    .set({
      ...next,
      badges: JSON.stringify(badges),
    })
    .where(eq(users.uid, uid));
}

/**
 * Atomically award (or adjust) coins for a user in Cloudflare D1.
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

  const user = await db.query.users.findFirst({
    where: eq(users.uid, opts.uid),
  });
  if (!user) throw new ApiError(404, "User not found.");
  if (user.disabled) throw new ApiError(400, "This account is disabled.");

  const coins = Math.max(0, (user.coins ?? 0) + amount);
  const weeklyCoins = Math.max(0, (user.weeklyCoins ?? 0) + amount);
  const monthlyCoins = Math.max(0, (user.monthlyCoins ?? 0) + amount);
  const xpGain = opts.xpAmount !== undefined ? Math.max(0, opts.xpAmount) : Math.max(0, amount);
  const xp = (user.xp ?? 0) + xpGain;
  const level = levelForXp(xp);

  const counters = {
    quizzesTaken: (user.quizzesTaken ?? 0) + (opts.counters?.quizzesTaken ?? 0),
    challengesApproved:
      (user.challengesApproved ?? 0) + (opts.counters?.challengesApproved ?? 0),
    certsCompleted: (user.certsCompleted ?? 0) + (opts.counters?.certsCompleted ?? 0),
  };

  let existingBadges: string[] = [];
  try {
    existingBadges = JSON.parse(user.badges ?? "[]");
  } catch {
    existingBadges = [];
  }

  const existingSet = new Set(existingBadges);
  const candidates = [
    ...thresholdBadges({ xp, ...counters }),
    ...(opts.extraBadges ?? []),
  ];
  const newBadges = candidates.filter((b) => !existingSet.has(b));
  const badges = [...existingSet, ...newBadges];

  const now = Date.now();
  const txId = `tx_${now}_${Math.random().toString(36).slice(2, 9)}`;

  // Update user in D1
  await db
    .update(users)
    .set({
      coins,
      weeklyCoins,
      monthlyCoins,
      xp,
      level,
      badges: JSON.stringify(badges),
      ...counters,
    })
    .where(eq(users.uid, opts.uid));

  // Insert transaction entry in D1
  await db.insert(coinTransactions).values({
    id: txId,
    uid: opts.uid,
    displayName: user.displayName ?? "Member",
    amount,
    source: opts.source,
    reason: opts.reason.slice(0, 500),
    refId: opts.refId ?? null,
    awardedBy: opts.awardedBy,
    createdAt: now,
  });

  return { newBalance: coins, newBadges };
}

