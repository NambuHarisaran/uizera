import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts, users } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { awardCoins, bumpStats } from "@/lib/server/coins";
import { audit } from "@/lib/server/audit";
import { getAnswerKey, getQuizOrThrow, gradeQuestion } from "@/lib/server/quiz";
import { quizSubmitSchema } from "@/lib/validation";
import type { QuestionType } from "@/types";

export const runtime = "nodejs";

const SUBMIT_GRACE_MS = 15_000;
const MIN_PARTICIPATION_XP = 5;
const SPEED_MAX_BONUS = 0.2;
const SPEED_MIN_ACCURACY = 0.7;

function speedMultiplier(timeTakenMs: number, durationMs: number, accuracyRatio: number): number {
  if (accuracyRatio < SPEED_MIN_ACCURACY || durationMs <= 0) return 1;
  const speedFraction = Math.max(0, Math.min(1, 1 - timeTakenMs / durationMs));
  return 1 + SPEED_MAX_BONUS * speedFraction;
}

/**
 * POST /api/quiz/[quizId]/submit
 * Grades an attempt server-side and stores results in Cloudflare D1.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;
    rateLimit(`quiz-submit:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await parseBody(req, quizSubmitSchema);

    if (!body.attemptId.startsWith(`${quizId}_${user.uid}_`)) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }

    const [quiz, answerKey, userRecord, attempt] = await Promise.all([
      getQuizOrThrow(quizId),
      getAnswerKey(quizId),
      db.query.users.findFirst({ where: eq(users.uid, user.uid) }),
      db.query.quizAttempts.findFirst({ where: eq(quizAttempts.id, body.attemptId) }),
    ]);

    if (!attempt) throw new ApiError(404, "Attempt not found.");

    if (attempt.uid !== user.uid) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }
    if (attempt.status !== "in_progress") {
      throw new ApiError(400, "This attempt was already submitted.");
    }

    const now = Date.now();
    if (now > attempt.deadlineAt + SUBMIT_GRACE_MS) {
      await db
        .update(quizAttempts)
        .set({ status: "expired" })
        .where(eq(quizAttempts.id, body.attemptId));
      throw new ApiError(400, "Time is up — this attempt has expired.");
    }

    let parsedQuestionOrder: string[] = [];
    let parsedOptionOrders: Record<string, number[]> = {};
    try {
      parsedQuestionOrder = JSON.parse(attempt.questionOrder ?? "[]");
      parsedOptionOrders = JSON.parse(attempt.optionOrders ?? "{}");
    } catch {}

    let score = 0;
    let correctCount = 0;

    for (const qid of parsedQuestionOrder) {
      const key = answerKey[qid];
      if (!key) continue;

      const displaySelected = body.answers[qid] ?? [];
      const order = parsedOptionOrders[qid] ?? [];
      const selected = displaySelected
        .map((d) => order[d])
        .filter((v): v is number => typeof v === "number");

      const questionType: QuestionType = key.correct.length > 1 ? "multi_select" : "mcq";
      const earned = gradeQuestion(questionType, selected, key.correct, key.points);
      score += earned;
      if (earned === key.points) correctCount += 1;
    }

    const accuracyRatio = attempt.maxScore > 0 ? score / attempt.maxScore : 0;
    const xpRewardTotal = quiz.xpReward ?? (quiz.totalPoints * 10 || 100);
    const xpEarned = Math.max(
      MIN_PARTICIPATION_XP,
      Math.round(accuracyRatio * xpRewardTotal)
    );

    const timeTakenMs = Math.max(0, now - attempt.startedAt);
    const durationMs = quiz.durationSeconds * 1000;
    const multiplier = speedMultiplier(timeTakenMs, durationMs, accuracyRatio);
    const isSpeedBonus = multiplier > 1;

    const coinsEarned = Math.round(score * quiz.coinsPerPoint * multiplier);
    const displayName = userRecord?.displayName ?? "Member";

    // Atomically transition attempt status from in_progress to submitted
    const updateRes = await db
      .update(quizAttempts)
      .set({
        status: "submitted",
        answers: JSON.stringify(body.answers),
        score,
        correctCount,
        coinsEarned,
        xpEarned,
        displayName,
        submittedAt: now,
      })
      .where(
        and(
          eq(quizAttempts.id, body.attemptId),
          eq(quizAttempts.status, "in_progress")
        )
      );

    let newBadges: string[] = [];
    if (coinsEarned > 0 || xpEarned > 0) {
      try {
        const award = await awardCoins({
          uid: user.uid,
          amount: coinsEarned,
          xpAmount: xpEarned,
          source: "quiz",
          reason: `Quiz: ${quiz.title}`,
          refId: body.attemptId,
          awardedBy: "system",
          counters: { quizzesTaken: 1 },
          extraBadges:
            score === attempt.maxScore && attempt.maxScore > 0
              ? ["perfect_score"]
              : [],
        });
        newBadges = award.newBadges;
      } catch (err) {
        console.error("[quiz-submit] coin/xp award failed:", err);
        await audit({
          actorUid: "system",
          actorEmail: "system",
          action: "quiz.award_failed",
          target: user.uid,
          details: {
            attemptId: body.attemptId,
            coins: coinsEarned,
            xp: xpEarned,
          },
        });
      }
    } else {
      await bumpStats(user.uid, { quizzesTaken: 1 }).catch(() => {});
    }

    return jsonOk({
      score,
      maxScore: attempt.maxScore,
      correctCount,
      totalQuestions: Object.keys(answerKey).length,
      coinsEarned,
      xpEarned,
      isSpeedBonus,
      newBadges,
      reviewAvailable: quiz.settings?.showReview,
    });
  });
}

