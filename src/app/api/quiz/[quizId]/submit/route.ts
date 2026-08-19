import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
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
import { toMillis } from "@/lib/utils";
import type { QuizAttempt, QuestionType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 10; // Vercel free tier cap

/** Grace window for network latency at the timer boundary. */
const SUBMIT_GRACE_MS = 15_000;

/** Minimum XP awarded even for a zero-score attempt (participation reward). */
const MIN_PARTICIPATION_XP = 5;

/**
 * Graduated speed bonus: up to +20% extra coins, linearly scaled by how
 * quickly the attempt was submitted — full bonus for instant, zero bonus at
 * the deadline. Only applied when accuracy ≥ 70% (prevents rewarding fast
 * guessing). Formula: multiplier = 1.0 + 0.2 × (1 − timeTaken/duration).
 */
const SPEED_MAX_BONUS = 0.2; // +20% at best
const SPEED_MIN_ACCURACY = 0.7; // must score ≥70% to get any bonus

function speedMultiplier(timeTakenMs: number, durationMs: number, accuracyRatio: number): number {
  if (accuracyRatio < SPEED_MIN_ACCURACY || durationMs <= 0) return 1;
  const speedFraction = Math.max(0, Math.min(1, 1 - timeTakenMs / durationMs));
  return 1 + SPEED_MAX_BONUS * speedFraction;
}

/**
 * POST /api/quiz/[quizId]/submit
 *
 * Grades an attempt entirely server-side against the private answer key.
 * Client sends DISPLAY option indices; they are mapped back through the
 * attempt's stored option shuffle, so tampering with indices cannot improve
 * a score beyond honestly knowing the answers. The transaction flips the
 * attempt from in_progress exactly once — replays get a 400.
 *
 * Grading is type-aware:
 *   - mcq / true_false / image: exact match (all-or-nothing)
 *   - multi_select: partial credit with wrong-answer penalty
 *
 * Rewards:
 *   - Speed bonus: +10% coins if finished in ≤50% time with ≥70% accuracy
 *   - Participation XP: minimum 5 XP even on zero-score submits
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

    // The attempt ID encodes quiz + owner; verify both before any reads.
    if (!body.attemptId.startsWith(`${quizId}_${user.uid}_`)) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }

    const quiz = await getQuizOrThrow(quizId);
    const answerKey = await getAnswerKey(quizId);

    const db = adminDb();
    const attemptRef = db.collection("quizAttempts").doc(body.attemptId);

    const profile = await db.collection("users").doc(user.uid).get();
    const displayName =
      (profile.data()?.displayName as string | undefined) ?? "Member";

    const graded = await db.runTransaction(async (tx) => {
      const snap = await tx.get(attemptRef);
      if (!snap.exists) throw new ApiError(404, "Attempt not found.");
      const attempt = snap.data() as QuizAttempt;

      if (attempt.uid !== user.uid) {
        throw new ApiError(403, "This attempt does not belong to you.");
      }
      if (attempt.status !== "in_progress") {
        throw new ApiError(400, "This attempt was already submitted.");
      }

      const now = Date.now();
      if (now > toMillis(attempt.deadlineAt) + SUBMIT_GRACE_MS) {
        tx.update(attemptRef, { status: "expired" });
        throw new ApiError(400, "Time is up — this attempt has expired.");
      }

      let score = 0;
      let correctCount = 0;

      for (const qid of attempt.questionOrder) {
        const key = answerKey[qid];
        if (!key) continue;

        const displaySelected = body.answers[qid] ?? [];
        const order = attempt.optionOrders[qid] ?? [];
        // display index → original index; drop anything out of range.
        const selected = displaySelected
          .map((d) => order[d])
          .filter((v): v is number => typeof v === "number");

        // Determine question type from public questions list — stored in key
        // We need the type to choose grading strategy. The answerKey doesn't
        // store type, so we infer from the number of correct answers:
        // A single correctIndex signals single-select type; multiple = multi_select.
        // More precisely, we rely on the type stored in the question order from
        // the attempt. We'll pass "multi_select" only when key has multiple correct.
        // For proper type-awareness we look at correctIndices count as a heuristic
        // until question type is stored on the key entry.
        const questionType: QuestionType =
          key.correct.length > 1 ? "multi_select" : "mcq";

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

      // Graduated speed bonus: 0%–20% extra coins based on how fast the
      // attempt was submitted and whether accuracy meets the threshold.
      const timeTakenMs = Math.max(0, now - toMillis(attempt.startedAt));
      const durationMs = quiz.durationSeconds * 1000;
      const multiplier = speedMultiplier(timeTakenMs, durationMs, accuracyRatio);
      // isSpeedBonus = true if the player earned any bonus (for UI display)
      const isSpeedBonus = multiplier > 1;

      const coinsEarned = Math.round(score * quiz.coinsPerPoint * multiplier);

      tx.update(attemptRef, {
        status: "submitted",
        answers: body.answers,
        score,
        correctCount,
        coinsEarned,
        xpEarned,
        isSpeedBonus,
        timeTakenMs,   // stored for leaderboard tiebreaking — lower = faster
        displayName,
        submittedAt: FieldValue.serverTimestamp(),
      });

      return {
        score,
        correctCount,
        coinsEarned,
        xpEarned,
        isSpeedBonus,
        timeTakenMs,
        maxScore: attempt.maxScore,
      };
    });

    let newBadges: string[] = [];
    if (graded.coinsEarned > 0 || graded.xpEarned > 0) {
      try {
        const award = await awardCoins({
          uid: user.uid,
          amount: Math.max(1, graded.coinsEarned),
          xpAmount: graded.xpEarned,
          source: "quiz",
          reason: `Quiz: ${quiz.title}`,
          refId: body.attemptId,
          awardedBy: "system",
          counters: { quizzesTaken: 1 },
          extraBadges:
            graded.score === graded.maxScore && graded.maxScore > 0
              ? ["perfect_score"]
              : [],
        });
        newBadges = award.newBadges;
      } catch (err) {
        // Attempt stays graded; surface for admin reconciliation.
        console.error("[quiz-submit] coin/xp award failed:", err);
        await audit({
          actorUid: "system",
          actorEmail: "system",
          action: "quiz.award_failed",
          target: user.uid,
          details: {
            attemptId: body.attemptId,
            coins: graded.coinsEarned,
            xp: graded.xpEarned,
          },
        });
      }
    } else {
      // Zero coins earned: still count the attempt toward stats/badges.
      await bumpStats(user.uid, { quizzesTaken: 1 }).catch(() => {});
    }

    return jsonOk({
      score: graded.score,
      maxScore: graded.maxScore,
      correctCount: graded.correctCount,
      totalQuestions: Object.keys(answerKey).length,
      coinsEarned: graded.coinsEarned,
      xpEarned: graded.xpEarned,
      isSpeedBonus: graded.isSpeedBonus,
      newBadges,
      reviewAvailable: quiz.settings.showReview,
    });
  });
}
