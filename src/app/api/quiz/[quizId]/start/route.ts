import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts, users } from "@/lib/db/schema";
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
 * Starts or resumes a quiz attempt in Cloudflare D1.
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

    const [quiz, questions, userRecord] = await Promise.all([
      getQuizOrThrow(quizId),
      getQuizQuestions(quizId),
      db.query.users.findFirst({ where: eq(users.uid, user.uid) }),
    ]);

    assertQuizOpen(quiz, now);

    if (questions.length === 0) {
      throw new ApiError(500, "Quiz has no questions yet.");
    }

    const displayName = userRecord?.displayName || "Member";

    // Check existing attempts for this user and quiz
    const existingAttempts = await db.query.quizAttempts.findMany({
      where: and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.uid, user.uid)
      ),
      orderBy: [desc(quizAttempts.attemptNo)],
    });

    const count = existingAttempts.length;
    const latest = existingAttempts[0];

    // Resume in-progress attempt if inside window
    if (latest && latest.status === "in_progress" && now < latest.deadlineAt) {
      let answers: any = {};
      let questionOrder: string[] = [];
      let optionOrders: Record<string, number[]> = {};
      try {
        answers = JSON.parse(latest.answers ?? "{}");
        questionOrder = JSON.parse(latest.questionOrder ?? "[]");
        optionOrders = JSON.parse(latest.optionOrders ?? "{}");
      } catch {}

      const view = buildAttemptQuestions(questions, questionOrder, optionOrders).map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.imageUrl,
        options: q.options,
        points: q.points,
      }));

      return jsonOk({
        attemptId: latest.id,
        resumed: true,
        deadlineAt: latest.deadlineAt,
        durationSeconds: quiz.durationSeconds,
        maxScore: latest.maxScore,
        questions: view,
        answers,
      });
    }

    const maxAttempts = quiz.settings?.maxAttempts ?? 1;
    if (count >= maxAttempts) {
      throw new ApiError(400, "You have used all attempts for this quiz.");
    }

    const attemptNo = count + 1;
    const { questionOrder, optionOrders } = generateOrders(
      questions,
      Boolean(quiz.settings?.randomizeQuestions),
      Boolean(quiz.settings?.randomizeOptions)
    );

    const deadline = Math.min(
      now + quiz.durationSeconds * 1000,
      toMillis(quiz.endAt)
    );

    const attemptId = `${quizId}_${user.uid}_${attemptNo}`;
    const maxScore = questions.reduce((s, q) => s + q.points, 0);

    await db.insert(quizAttempts).values({
      id: attemptId,
      quizId,
      quizTitle: quiz.title,
      uid: user.uid,
      displayName,
      attemptNo,
      status: "in_progress",
      questionOrder: JSON.stringify(questionOrder),
      optionOrders: JSON.stringify(optionOrders),
      answers: JSON.stringify({}),
      score: 0,
      maxScore,
      correctCount: 0,
      coinsEarned: 0,
      startedAt: now,
      deadlineAt: deadline,
      submittedAt: null,
    });

    const view = buildAttemptQuestions(questions, questionOrder, optionOrders).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
    }));

    return jsonOk({
      attemptId,
      resumed: false,
      deadlineAt: deadline,
      durationSeconds: quiz.durationSeconds,
      maxScore,
      questions: view,
      answers: {},
    });
  });
}

