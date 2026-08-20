import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, quizQuestions, quizAnswerKeys } from "@/lib/db/schema";
import { ApiError } from "@/lib/server/api";
import { shuffle, toMillis } from "@/lib/utils";
import type { Quiz, QuestionType, QuizQuestionPublic, QuizStatus } from "@/types";

/**
 * Type-aware question grader.
 *
 * - mcq / true_false / image: exact match — full points or zero.
 * - multi_select: partial credit with wrong-answer penalty.
 *   Formula: max(0, correctHits − wrongHits) / totalCorrect × points
 *   The penalty prevents the "select all options" exploit.
 *
 * `selected` and `correct` must both be original (pre-shuffle) option indices.
 */
export function gradeQuestion(
  type: QuestionType,
  selected: number[],
  correct: number[],
  points: number
): number {
  const S = new Set(selected);
  const C = new Set(correct);

  if (type === "multi_select") {
    const correctHits = [...S].filter((v) => C.has(v)).length;
    const wrongHits = [...S].filter((v) => !C.has(v)).length;
    const net = Math.max(0, correctHits - wrongHits);
    return C.size > 0 ? Math.round((net / C.size) * points) : 0;
  }

  // Exact match for mcq, true_false, image
  const exact = S.size === C.size && [...C].every((c) => S.has(c));
  return exact ? points : 0;
}

export interface AnswerKeyEntry {
  correct: number[];
  explanation: string | null;
  points: number;
}

export async function getQuizOrThrow(quizId: string): Promise<Quiz> {
  const row = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
  });
  if (!row) throw new ApiError(404, "Quiz not found.");

  let settings: any = {};
  try {
    settings = JSON.parse(row.settings ?? "{}");
  } catch {
    settings = {};
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    coverImage: row.coverImage ?? null,
    status: row.status as QuizStatus,
    mode: row.mode as "async" | "live",
    startAt: row.startAt ? new Date(row.startAt) : null,
    endAt: row.endAt ? new Date(row.endAt) : null,
    durationSeconds: row.durationSeconds,
    questionCount: row.questionCount,
    totalPoints: row.totalPoints,
    coinsPerPoint: row.coinsPerPoint,
    xpReward: row.xpReward ?? 100,
    settings,
    createdBy: row.createdBy,
    hostUid: row.hostUid ?? undefined,
    hostDisplayName: row.hostDisplayName ?? undefined,
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
  };

}

export async function getQuizQuestions(
  quizId: string
): Promise<QuizQuestionPublic[]> {
  const rows = await db.query.quizQuestions.findMany({
    where: eq(quizQuestions.quizId, quizId),
    orderBy: [asc(quizQuestions.orderIndex)],
  });

  return rows.map((r) => {
    let parsedOptions: string[] = [];
    try {
      parsedOptions = JSON.parse(r.options ?? "[]");
    } catch {
      parsedOptions = [];
    }
    return {
      id: r.id,
      type: r.type as QuestionType,
      prompt: r.prompt,
      imageUrl: r.imageUrl ?? null,
      options: parsedOptions,
      points: r.points,
      order: r.orderIndex,
    };
  });
}

export async function getAnswerKey(
  quizId: string
): Promise<Record<string, AnswerKeyEntry>> {
  const [rows, questionRows] = await Promise.all([
    db.query.quizAnswerKeys.findMany({
      where: eq(quizAnswerKeys.quizId, quizId),
    }),
    db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quizId),
    }),
  ]);

  const qMap = new Map(questionRows.map((q) => [q.id, q]));
  const map: Record<string, AnswerKeyEntry> = {};
  for (const r of rows) {
    let parsedCorrect: number[] = [];
    try {
      parsedCorrect = JSON.parse(r.correctIndices ?? "[]");
    } catch {
      parsedCorrect = [];
    }
    const q = qMap.get(r.questionId);
    map[r.questionId] = {
      correct: parsedCorrect,
      explanation: r.explanation ?? null,
      points: q?.points ?? 10,
    };
  }
  return map;
}


/** A quiz is playable inside its window while scheduled/live. */
export function assertQuizOpen(quiz: Quiz, now: number): void {
  if (quiz.mode === "live") {
    throw new ApiError(400, "This is a live-session quiz — join it from the Live Stage link instead.");
  }
  if (quiz.status === "draft") throw new ApiError(404, "Quiz not found.");
  if (quiz.status === "closed") throw new ApiError(400, "This quiz has ended.");
  const startAt = toMillis(quiz.startAt);
  const endAt = toMillis(quiz.endAt);
  if (now < startAt) throw new ApiError(400, "This quiz has not started yet.");
  if (now > endAt) throw new ApiError(400, "This quiz has ended.");
}

/**
 * Deterministic per-attempt view: apply the stored orders so a resumed
 * attempt always sees the same question and option arrangement.
 */
export function buildAttemptQuestions(
  questions: QuizQuestionPublic[],
  questionOrder: string[],
  optionOrders: Record<string, number[]>
): QuizQuestionPublic[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return questionOrder
    .map((qid) => {
      const q = byId.get(qid);
      if (!q) return null;
      const order = optionOrders[qid] ?? q.options.map((_, i) => i);
      return { ...q, options: order.map((orig) => q.options[orig] ?? "") };
    })
    .filter((q): q is QuizQuestionPublic => q !== null);
}

/** Generate randomized orders for a fresh attempt. */
export function generateOrders(
  questions: QuizQuestionPublic[],
  randomizeQuestions: boolean,
  randomizeOptions: boolean
): { questionOrder: string[]; optionOrders: Record<string, number[]> } {
  const ids = questions.map((q) => q.id);
  const questionOrder = randomizeQuestions ? shuffle(ids) : ids;

  const optionOrders: Record<string, number[]> = {};
  for (const q of questions) {
    const identity = q.options.map((_, i) => i);
    // Never shuffle true/false — "True" stays first.
    optionOrders[q.id] =
      randomizeOptions && q.type !== "true_false" ? shuffle(identity) : identity;
  }
  return { questionOrder, optionOrders };
}

