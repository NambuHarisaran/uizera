import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, liveQuizSessions, liveQuizResponses } from "@/lib/db/schema";
import { awardCoins } from "@/lib/server/coins";
import { getQuizQuestions } from "@/lib/server/quiz";

/**
 * Ends a live quiz session and awards coins + XP to all participants in Cloudflare D1.
 *
 * Called by both:
 *   - POST /api/admin/live-quiz/[quizId]/control  (action: "end")
 *   - POST /api/host/live-quiz/[quizId]/control   (action: "end")
 *
 * Idempotent: the caller is expected to check `currentSession.status !== "ended"`
 * before calling this function to avoid double-awarding.
 */
export async function endLiveQuizSession(
  quizId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quizData: Record<string, any>
): Promise<void> {
  const now = Date.now();

  // Close the quiz in D1
  await db.update(quizzes).set({ status: "closed", updatedAt: now }).where(eq(quizzes.id, quizId));

  // End the live session in D1
  await db
    .update(liveQuizSessions)
    .set({ status: "ended", viewState: "leaderboard", updatedAt: now })
    .where(eq(liveQuizSessions.quizId, quizId));

  const questions = await getQuizQuestions(quizId);
  const maxScore = questions.reduce((s, q) => s + q.points, 0);
  const xpRewardTotal = quizData.xpReward ?? (maxScore * 10 || 100);
  const coinsPerPoint = quizData.coinsPerPoint ?? 1;

  // Read all participant responses from D1
  const responses = await db.query.liveQuizResponses.findMany({
    where: eq(liveQuizResponses.quizId, quizId),
  });

  for (const resp of responses) {
    const score = Math.max(0, Math.min(maxScore, resp.totalScore ?? 0));
    if (score <= 0) continue;

    const coinsEarned = Math.round(score * coinsPerPoint);
    const accuracyRatio = maxScore > 0 ? score / maxScore : 0;
    const xpEarned = Math.round(accuracyRatio * xpRewardTotal);
    if (coinsEarned <= 0 && xpEarned <= 0) continue;

    try {
      await awardCoins({
        uid: resp.uid,
        amount: Math.max(1, coinsEarned),
        xpAmount: xpEarned,
        source: "quiz",
        reason: `Live Stage Quiz: ${quizData.title}`,
        refId: quizId,
        awardedBy: "system",
        counters: { quizzesTaken: 1 },
      });
    } catch (err) {
      console.error("[live-quiz] award failed for", resp.uid, err);
    }
  }
}

