import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts } from "@/lib/db/schema";
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

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId]/review?attempt=<attemptId>
 * Review submitted attempt from Cloudflare D1.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    const attemptId =
      req.nextUrl.searchParams.get("attemptId") ||
      req.nextUrl.searchParams.get("attempt") ||
      "";

    if (!attemptId.startsWith(`${quizId}_${user.uid}_`)) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }

    const [quiz, attempt] = await Promise.all([
      getQuizOrThrow(quizId),
      db.query.quizAttempts.findFirst({
        where: eq(quizAttempts.id, attemptId),
      }),
    ]);

    if (!attempt) throw new ApiError(404, "Attempt not found.");
    if (attempt.uid !== user.uid) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }
    if (attempt.status !== "submitted") {
      throw new ApiError(400, "Only submitted attempts can be reviewed.");
    }

    let parsedAnswers: any = {};
    let parsedQuestionOrder: string[] = [];
    let parsedOptionOrders: Record<string, number[]> = {};
    try {
      parsedAnswers = JSON.parse(attempt.answers ?? "{}");
      parsedQuestionOrder = JSON.parse(attempt.questionOrder ?? "[]");
      parsedOptionOrders = JSON.parse(attempt.optionOrders ?? "{}");
    } catch {}

    const [questions, answerKey] = await Promise.all([
      getQuizQuestions(quizId),
      getAnswerKey(quizId),
    ]);

    const ordered = buildAttemptQuestions(
      questions,
      parsedQuestionOrder,
      parsedOptionOrders
    );

    const items = ordered.map((q) => {
      const key = answerKey[q.id];
      const order = parsedOptionOrders[q.id] ?? q.options.map((_, i) => i);
      const correctDisplay = (key?.correct ?? [])
        .map((orig) => order.indexOf(orig))
        .filter((i) => i >= 0);
      const selectedDisplay = parsedAnswers[q.id] ?? [];

      const exact =
        correctDisplay.length === selectedDisplay.length &&
        correctDisplay.every((c: number) => selectedDisplay.includes(c));

      return {
        question: q,
        selected: selectedDisplay,
        correct: correctDisplay,
        explanation: key?.explanation ?? null,
        earned: exact ? (key?.points ?? 0) : 0,
      };
    });

    return jsonOk({
      attempt: {
        ...attempt,
        quizTitle: quiz.title,
        answers: parsedAnswers,
        startedAt: attempt.startedAt ? new Date(attempt.startedAt) : null,
        submittedAt: attempt.submittedAt ? new Date(attempt.submittedAt) : null,
      },
      items,
    });
  });
}

