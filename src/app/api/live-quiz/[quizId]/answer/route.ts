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
import { getAnswerKey } from "@/lib/server/quiz";
import { liveQuizAnswerSchema } from "@/lib/validation";
import type { LiveQuizSession } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/live-quiz/[quizId]/answer
 *
 * Grades one participant's answer to the currently active stage question,
 * server-side against the private answer key — same trust model as the async
 * quiz submit route, just scoped to a single question instead of a whole
 * attempt. Rejected once the host advances, reveals, or already has an answer
 * on file for this question, so a slow client replaying a stale question
 * can't score points after the room has moved on.
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

    const answerKey = await getAnswerKey(quizId);
    const key = answerKey[body.questionId];
    if (!key) throw new ApiError(404, "Question not found.");

    const db = adminDb();
    const sessionRef = db.collection("liveQuizSessions").doc(quizId);
    const responseRef = sessionRef.collection("responses").doc(user.uid);

    const profileSnap = await db.collection("users").doc(user.uid).get();
    const displayName =
      (profileSnap.data()?.displayName as string | undefined) || "Participant";

    const result = await db.runTransaction(async (tx) => {
      const [sessionSnap, responseSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(responseRef),
      ]);

      if (!sessionSnap.exists) throw new ApiError(404, "Live session not found.");
      const session = sessionSnap.data() as LiveQuizSession;

      if (session.status !== "active") {
        throw new ApiError(400, "This stage isn't accepting answers right now.");
      }
      if (session.currentQuestionIndex !== body.questionIndex) {
        throw new ApiError(400, "That question is no longer active.");
      }
      if (session.revealAnswer) {
        throw new ApiError(400, "Answers are locked for this question.");
      }

      const existingAnswers = (responseSnap.data()?.answers ?? {}) as Record<
        string,
        { selected: number[]; correct: boolean; points: number; answeredAtMs: number }
      >;
      if (existingAnswers[body.questionId]) {
        throw new ApiError(400, "You already answered this question.");
      }

      const correctSet = new Set(key.correct);
      const selectedSet = new Set(body.selected);
      const isCorrect =
        selectedSet.size === correctSet.size &&
        [...correctSet].every((c) => selectedSet.has(c));

      // Kahoot-style speed bonus: full points for an instant answer, floor of
      // half credit right up to the buzzer.
      const elapsedMs = Math.max(0, Date.now() - (session.questionStartAtMs ?? Date.now()));
      const durationMs = Math.max(1000, (session.questionDurationSeconds ?? 30) * 1000);
      const speedFraction = Math.max(0, Math.min(1, 1 - elapsedMs / durationMs));
      const pointsEarned = isCorrect ? Math.round(key.points * (0.5 + 0.5 * speedFraction)) : 0;

      const newAnswers = {
        ...existingAnswers,
        [body.questionId]: {
          selected: body.selected,
          correct: isCorrect,
          points: pointsEarned,
          answeredAtMs: Date.now(),
        },
      };
      const newTotal = (responseSnap.data()?.totalScore ?? 0) + pointsEarned;

      tx.set(
        responseRef,
        {
          uid: user.uid,
          displayName,
          answers: newAnswers,
          totalScore: newTotal,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { isCorrect, pointsEarned, totalScore: newTotal };
    });

    return jsonOk(result);
  });
}
