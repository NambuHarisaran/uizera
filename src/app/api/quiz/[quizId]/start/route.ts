import { NextRequest } from "next/server";
import { adminDb, FieldValue, Timestamp } from "@/lib/firebase/admin";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import {
  assertQuizOpen,
  buildAttemptQuestions,
  generateOrders,
  getQuizOrThrow,
  getQuizQuestions,
} from "@/lib/server/quiz";
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/quiz/[quizId]/start
 *
 * Starts (or resumes) a quiz attempt. Attempt limits are enforced in a
 * Firestore transaction on a per-user counter document, so parallel requests
 * cannot mint extra attempts. Question/option order is randomized server-side
 * per attempt and stored, so a resume shows the identical arrangement and
 * clients never influence ordering.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;
    rateLimit(`quiz-start:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const now = Date.now();
    const quiz = await getQuizOrThrow(quizId);
    assertQuizOpen(quiz, now);

    const questions = await getQuizQuestions(quizId);
    if (questions.length === 0) {
      throw new ApiError(500, "Quiz has no questions yet.");
    }

    const db = adminDb();
    const counterRef = db
      .collection("quizzes")
      .doc(quizId)
      .collection("attemptCounters")
      .doc(user.uid);

    const result = await db.runTransaction(async (tx) => {
      const counterSnap = await tx.get(counterRef);
      const count = (counterSnap.data()?.count as number | undefined) ?? 0;

      // Resume an in-progress attempt if it is still inside its window.
      if (count > 0) {
        const lastRef = db
          .collection("quizAttempts")
          .doc(`${quizId}_${user.uid}_${count}`);
        const lastSnap = await tx.get(lastRef);
        if (lastSnap.exists) {
          const last = lastSnap.data() as QuizAttempt;
          if (last.status === "in_progress" && now < toMillis(last.deadlineAt)) {
            return { attempt: { ...last, id: lastRef.id }, resumed: true };
          }
        }
      }

      if (count >= quiz.settings.maxAttempts) {
        throw new ApiError(400, "You have used all attempts for this quiz.");
      }

      const attemptNo = count + 1;
      const { questionOrder, optionOrders } = generateOrders(
        questions,
        quiz.settings.randomizeQuestions,
        quiz.settings.randomizeOptions
      );

      const deadline = Math.min(
        now + quiz.durationSeconds * 1000,
        toMillis(quiz.endAt)
      );

      const attemptRef = db
        .collection("quizAttempts")
        .doc(`${quizId}_${user.uid}_${attemptNo}`);

      const attempt: Omit<QuizAttempt, "startedAt" | "submittedAt"> & {
        startedAt: FirebaseFirestore.FieldValue;
        submittedAt: null;
      } = {
        id: attemptRef.id,
        quizId,
        quizTitle: quiz.title,
        uid: user.uid,
        displayName: "",
        attemptNo,
        status: "in_progress",
        questionOrder,
        optionOrders,
        answers: {},
        score: 0,
        maxScore: questions.reduce((s, q) => s + q.points, 0),
        correctCount: 0,
        coinsEarned: 0,
        startedAt: FieldValue.serverTimestamp(),
        deadlineAt: Timestamp.fromMillis(deadline),
        submittedAt: null,
      };

      tx.set(attemptRef, attempt);
      tx.set(counterRef, { count: attemptNo, uid: user.uid }, { merge: true });

      return {
        attempt: { ...attempt, startedAt: now } as unknown as QuizAttempt,
        resumed: false,
      };
    });

    const view = buildAttemptQuestions(
      questions,
      result.attempt.questionOrder,
      result.attempt.optionOrders
    ).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
    }));

    return jsonOk({
      attemptId: result.attempt.id,
      resumed: result.resumed,
      deadlineAt: toMillis(result.attempt.deadlineAt),
      durationSeconds: quiz.durationSeconds,
      maxScore: result.attempt.maxScore,
      questions: view,
      answers: result.resumed ? result.attempt.answers : {},
    });
  });
}
