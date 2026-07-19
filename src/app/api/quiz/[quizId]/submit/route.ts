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
import { getAnswerKey, getQuizOrThrow } from "@/lib/server/quiz";
import { quizSubmitSchema } from "@/lib/validation";
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";

/** Grace window for network latency at the timer boundary. */
const SUBMIT_GRACE_MS = 15_000;

/**
 * POST /api/quiz/[quizId]/submit
 *
 * Grades an attempt entirely server-side against the private answer key.
 * Client sends DISPLAY option indices; they are mapped back through the
 * attempt's stored option shuffle, so tampering with indices cannot improve
 * a score beyond honestly knowing the answers. The transaction flips the
 * attempt from in_progress exactly once — replays get a 400.
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

        const correctSet = new Set(key.correct);
        const selectedSet = new Set(selected);
        const exact =
          selectedSet.size === correctSet.size &&
          [...correctSet].every((c) => selectedSet.has(c));

        if (exact) {
          score += key.points;
          correctCount += 1;
        }
      }

      const coinsEarned = Math.round(score * quiz.coinsPerPoint);

      tx.update(attemptRef, {
        status: "submitted",
        answers: body.answers,
        score,
        correctCount,
        coinsEarned,
        displayName,
        submittedAt: FieldValue.serverTimestamp(),
      });

      return { score, correctCount, coinsEarned, maxScore: attempt.maxScore };
    });

    let newBadges: string[] = [];
    if (graded.coinsEarned > 0) {
      try {
        const award = await awardCoins({
          uid: user.uid,
          amount: graded.coinsEarned,
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
        console.error("[quiz-submit] coin award failed:", err);
        await audit({
          actorUid: "system",
          actorEmail: "system",
          action: "quiz.award_failed",
          target: user.uid,
          details: { attemptId: body.attemptId, coins: graded.coinsEarned },
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
      newBadges,
      reviewAvailable: quiz.settings.showReview,
    });
  });
}
