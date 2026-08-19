import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  liveQuizSessions,
  liveQuizResponses,
  users,
} from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { getAnswerKey } from "@/lib/server/quiz";
import { liveQuizAnswerSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/live-quiz/[quizId]/answer
 * Grades one participant's answer to the active live stage question in Cloudflare D1.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;

    rateLimit(`live-quiz-answer:${user.uid}`, { limit: 30, windowMs: 60_000 });

    const body = await parseBody(req, liveQuizAnswerSchema);

    const [answerKey, session, responseRecord, userRecord] = await Promise.all([
      getAnswerKey(quizId),
      db.query.liveQuizSessions.findFirst({
        where: eq(liveQuizSessions.quizId, quizId),
      }),
      db.query.liveQuizResponses.findFirst({
        where: and(
          eq(liveQuizResponses.quizId, quizId),
          eq(liveQuizResponses.uid, user.uid)
        ),
      }),
      db.query.users.findFirst({
        where: eq(users.uid, user.uid),
      }),
    ]);

    const key = answerKey[body.questionId];
    if (!key) throw new ApiError(404, "Question not found.");
    if (!session) throw new ApiError(404, "Live session not found.");

    if (session.status !== "active") {
      throw new ApiError(400, "This stage isn't accepting answers right now.");
    }
    if (session.currentQuestionIndex !== body.questionIndex) {
      throw new ApiError(400, "That question is no longer active.");
    }
    if (session.revealAnswer) {
      throw new ApiError(400, "Answers are locked for this question.");
    }

    let existingAnswers: Record<
      string,
      { selected: number[]; correct: boolean; points: number; answeredAtMs: number }
    > = {};
    try {
      existingAnswers = JSON.parse(responseRecord?.answers ?? "{}");
    } catch {}

    if (existingAnswers[body.questionId]) {
      throw new ApiError(400, "You already answered this question.");
    }

    const correctSet = new Set(key.correct);
    const selectedSet = new Set(body.selected);
    const isCorrect =
      selectedSet.size === correctSet.size &&
      [...correctSet].every((c) => selectedSet.has(c));

    const now = Date.now();
    const elapsedMs = Math.max(0, now - (session.questionStartAtMs || now));
    const durationMs = Math.max(1000, (session.questionDurationSeconds || 30) * 1000);
    const speedFraction = Math.max(0, Math.min(1, 1 - elapsedMs / durationMs));
    const pointsEarned = isCorrect ? Math.round(key.points * (0.5 + 0.5 * speedFraction)) : 0;

    const newAnswers = {
      ...existingAnswers,
      [body.questionId]: {
        selected: body.selected,
        correct: isCorrect,
        points: pointsEarned,
        answeredAtMs: now,
        elapsedMs,
      },
    };

    const newTotal = (responseRecord?.totalScore ?? 0) + pointsEarned;
    const newTotalAnswerMs = (responseRecord?.totalAnswerMs ?? 0) + elapsedMs;
    const displayName = userRecord?.displayName || user.email?.split("@")[0] || "Participant";

    if (responseRecord) {
      await db
        .update(liveQuizResponses)
        .set({
          displayName,
          answers: JSON.stringify(newAnswers),
          totalScore: newTotal,
          totalAnswerMs: newTotalAnswerMs,
          updatedAt: now,
        })
        .where(
          and(
            eq(liveQuizResponses.quizId, quizId),
            eq(liveQuizResponses.uid, user.uid)
          )
        );
    } else {
      await db.insert(liveQuizResponses).values({
        quizId,
        uid: user.uid,
        displayName,
        answers: JSON.stringify(newAnswers),
        totalScore: newTotal,
        totalAnswerMs: newTotalAnswerMs,
        updatedAt: now,
      });
    }

    // Touch session updatedAt so polling devices pick up new answer counts
    await db
      .update(liveQuizSessions)
      .set({ lastAnswerAt: now, updatedAt: now })
      .where(eq(liveQuizSessions.quizId, quizId));

    return jsonOk({ received: true, totalScore: newTotal });
  });
}

