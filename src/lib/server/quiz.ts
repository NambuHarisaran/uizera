import "server-only";

import { adminDb, FieldValue, Timestamp } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/server/api";
import { shuffle, toMillis } from "@/lib/utils";
import type { QuizUpsertInput } from "@/lib/validation";
import type { Quiz, QuizQuestionPublic, QuizStatus } from "@/types";

/** Split validated quiz input into the public docs + private answer key. */
export function buildQuizDocs(input: {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  mode?: "async" | "live";
  status: QuizStatus;
  startAt: number;
  endAt: number;
  durationSeconds: number;
  coinsPerPoint: number;
  xpReward?: number;
  settings: any;
  questions: any[];
}) {
  const questions = input.questions.map((q: any, i: number) => {
    const id = q.id ?? `q${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      publicDoc: {
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.imageUrl ?? null,
        options: q.options,
        points: q.points,
        order: i,
      },
      keyEntry: {
        correct: q.correctIndices,
        explanation: q.explanation ?? null,
        points: q.points,
      },
    };
  });

  const totalPoints = input.questions.reduce((s: number, q: any) => s + (q.points ?? 0), 0);

  const quizDoc = {
    title: input.title,
    description: input.description ?? "",
    coverImage: input.coverImage ?? null,
    mode: input.mode ?? "async",
    status: input.status,
    startAt: Timestamp.fromMillis(input.startAt),
    endAt: Timestamp.fromMillis(input.endAt),
    durationSeconds: input.durationSeconds,
    questionCount: input.questions.length,
    totalPoints,
    coinsPerPoint: input.coinsPerPoint,
    xpReward: input.xpReward ?? (totalPoints * 10 || 100),
    settings: input.settings,
    updatedAt: FieldValue.serverTimestamp(),
  };

  return { quizDoc, questions };
}

export interface AnswerKeyEntry {
  correct: number[];
  explanation: string | null;
  points: number;
}

export async function getQuizOrThrow(quizId: string): Promise<Quiz> {
  const snap = await adminDb().collection("quizzes").doc(quizId).get();
  if (!snap.exists) throw new ApiError(404, "Quiz not found.");
  return { ...(snap.data() as Quiz), id: snap.id };
}

export async function getQuizQuestions(
  quizId: string
): Promise<QuizQuestionPublic[]> {
  const snap = await adminDb()
    .collection("quizzes")
    .doc(quizId)
    .collection("questions")
    .orderBy("order")
    .get();
  return snap.docs.map((d) => ({ ...(d.data() as QuizQuestionPublic), id: d.id }));
}

export async function getAnswerKey(
  quizId: string
): Promise<Record<string, AnswerKeyEntry>> {
  const snap = await adminDb()
    .collection("quizzes")
    .doc(quizId)
    .collection("answerKey")
    .doc("main")
    .get();
  if (!snap.exists) throw new ApiError(500, "Quiz is misconfigured.");
  return (snap.data()?.answers ?? {}) as Record<string, AnswerKeyEntry>;
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
