import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  ApiError,
  handleApi,
  jsonOk,
  requireUser,
} from "@/lib/server/api";
import {
  buildAttemptQuestions,
  getAnswerKey,
  getQuizOrThrow,
  getQuizQuestions,
} from "@/lib/server/quiz";
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId]/review?attempt=<attemptId>
 *
 * Answer review is only released once the quiz window has fully ended, so a
 * fast finisher can never leak answers to students still playing.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    const quiz = await getQuizOrThrow(quizId);
    if (!quiz.settings.showReview) {
      throw new ApiError(403, "Review is not enabled for this quiz.");
    }
    const ended = quiz.status === "closed" || Date.now() > toMillis(quiz.endAt);
    if (!ended) {
      throw new ApiError(403, "Review unlocks after the quiz ends.");
    }

    const attemptId = req.nextUrl.searchParams.get("attempt") ?? "";
    if (!attemptId.startsWith(`${quizId}_${user.uid}_`)) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }

    const snap = await adminDb().collection("quizAttempts").doc(attemptId).get();
    if (!snap.exists) throw new ApiError(404, "Attempt not found.");
    const attempt = snap.data() as QuizAttempt;
    if (attempt.uid !== user.uid) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }
    if (attempt.status !== "submitted") {
      throw new ApiError(400, "Only submitted attempts can be reviewed.");
    }

    const [questions, answerKey] = await Promise.all([
      getQuizQuestions(quizId),
      getAnswerKey(quizId),
    ]);

    const ordered = buildAttemptQuestions(
      questions,
      attempt.questionOrder,
      attempt.optionOrders
    );

    const items = ordered.map((q) => {
      const key = answerKey[q.id];
      const order = attempt.optionOrders[q.id] ?? q.options.map((_, i) => i);
      // original correct index → display index for this attempt's shuffle.
      const correctDisplay = (key?.correct ?? [])
        .map((orig) => order.indexOf(orig))
        .filter((i) => i >= 0);
      const selectedDisplay = attempt.answers[q.id] ?? [];

      const exact =
        correctDisplay.length === selectedDisplay.length &&
        correctDisplay.every((c) => selectedDisplay.includes(c));

      return {
        question: q,
        selected: selectedDisplay,
        correct: correctDisplay,
        explanation: key?.explanation ?? null,
        earned: exact ? (key?.points ?? 0) : 0,
      };
    });

    return jsonOk({
      quizTitle: quiz.title,
      score: attempt.score,
      maxScore: attempt.maxScore,
      items,
    });
  });
}
