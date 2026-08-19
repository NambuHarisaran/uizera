import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { users, coinTransactions } from "@/lib/db/schema";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireUser } from "@/lib/server/api";
import { awardCoins } from "@/lib/server/coins";
import { levelForXp } from "@/lib/utils";

export const runtime = "nodejs";

const claimSchema = z.object({
  questId: z.string().min(1).max(64),
});

const QUEST_REWARDS: Record<string, { xp: number; coins: number; reqField: string; reqValue: number }> = {
  daily_quiz: { xp: 50, coins: 25, reqField: "quizzesTaken", reqValue: 1 },
  quiz_apprentice: { xp: 150, coins: 75, reqField: "quizzesTaken", reqValue: 5 },
  quiz_grandmaster: { xp: 300, coins: 150, reqField: "quizzesTaken", reqValue: 10 },
  first_challenge: { xp: 200, coins: 100, reqField: "challengesApproved", reqValue: 1 },
  cert_sprint: { xp: 250, coins: 120, reqField: "certsCompleted", reqValue: 5 },
  reach_level_5: { xp: 400, coins: 200, reqField: "level", reqValue: 5 },
  reach_level_10: { xp: 800, coins: 400, reqField: "level", reqValue: 10 },
};

export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { questId } = await parseBody(req, claimSchema);

    const reward = QUEST_REWARDS[questId];
    if (!reward) throw new ApiError(400, "Unknown quest ID.");

    // Check if already claimed
    const existingClaim = await db.query.coinTransactions.findFirst({
      where: and(
        eq(coinTransactions.uid, user.uid),
        eq(coinTransactions.source, "quest_reward"),
        eq(coinTransactions.refId, questId)
      ),
    });

    if (existingClaim) {
      throw new ApiError(400, "Quest reward already claimed.");
    }

    const profile = await db.query.users.findFirst({
      where: eq(users.uid, user.uid),
    });
    if (!profile) throw new ApiError(404, "User not found.");

    const val = reward.reqField === "level" ? levelForXp(profile.xp ?? 0) : (profile as any)[reward.reqField] ?? 0;

    if (val < reward.reqValue) {
      throw new ApiError(400, "Quest requirements not met yet.");
    }

    // Award XP and coins via D1
    const award = await awardCoins({
      uid: user.uid,
      amount: reward.coins,
      xpAmount: reward.xp,
      source: "quest_reward",
      reason: `Quest Claimed: ${questId}`,
      refId: questId,
      awardedBy: "system",
    });

    return jsonOk({
      newCoins: award.newBalance,
      xpAwarded: reward.xp,
      coinsAwarded: reward.coins,
      newBadges: award.newBadges,
    });
  });
}

