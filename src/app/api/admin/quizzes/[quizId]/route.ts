import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, quizQuestions, quizAnswerKeys, liveQuizSessions, liveQuizParticipants, liveQuizResponses } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { quizUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** GET — full quiz incl. questions + answer key for the editor from Cloudflare D1. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    await requireAdmin();
    const { quizId } = await params;

    const quizRow = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });
    if (!quizRow) throw new ApiError(404, "Quiz not found.");

    const [qRows, keyRows] = await Promise.all([
      db.query.quizQuestions.findMany({
        where: eq(quizQuestions.quizId, quizId),
        orderBy: [asc(quizQuestions.orderIndex)],
      }),
      db.query.quizAnswerKeys.findMany({
        where: eq(quizAnswerKeys.quizId, quizId),
      }),
    ]);

    const answersMap: Record<string, { correct: number[]; explanation: string | null }> = {};
    for (const k of keyRows) {
      try {
        answersMap[k.questionId] = {
          correct: JSON.parse(k.correctIndices ?? "[]"),
          explanation: k.explanation,
        };
      } catch {}
    }

    const questions = qRows.map((q) => {
      let options: string[] = [];
      try {
        options = JSON.parse(q.options ?? "[]");
      } catch {}
      return {
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.imageUrl,
        options,
        points: q.points,
        order: q.orderIndex,
        correctIndices: answersMap[q.id]?.correct ?? [],
        explanation: answersMap[q.id]?.explanation ?? null,
      };
    });

    let settings: any = {};
    try {
      settings = JSON.parse(quizRow.settings ?? "{}");
    } catch {}

    const quiz = {
      id: quizRow.id,
      title: quizRow.title,
      description: quizRow.description,
      coverImage: quizRow.coverImage,
      status: quizRow.status,
      mode: quizRow.mode,
      startAt: quizRow.startAt ? new Date(quizRow.startAt) : null,
      endAt: quizRow.endAt ? new Date(quizRow.endAt) : null,
      durationSeconds: quizRow.durationSeconds,
      questionCount: quizRow.questionCount,
      totalPoints: quizRow.totalPoints,
      coinsPerPoint: quizRow.coinsPerPoint,
      xpReward: quizRow.xpReward,
      settings,
      createdBy: quizRow.createdBy,
      hostUid: quizRow.hostUid,
      hostDisplayName: quizRow.hostDisplayName,
      createdAt: quizRow.createdAt ? new Date(quizRow.createdAt) : new Date(),
      updatedAt: quizRow.updatedAt ? new Date(quizRow.updatedAt) : new Date(),
    };

    return jsonOk({ quiz, questions });
  });
}

/** PUT — replace quiz metadata, questions, and answer key in Cloudflare D1. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;
    const input = await parseBody(req, quizUpsertSchema);

    const quizRow = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });
    if (!quizRow) throw new ApiError(404, "Quiz not found.");

    const now = Date.now();
    const totalPoints = input.questions.reduce((s: number, q: any) => s + (q.points ?? 0), 0);

    // Update quiz metadata
    await db
      .update(quizzes)
      .set({
        title: input.title,
        description: input.description ?? "",
        coverImage: input.coverImage ?? null,
        mode: input.mode ?? "async",
        status: input.status,
        startAt: input.startAt,
        endAt: input.endAt,
        durationSeconds: input.durationSeconds,
        questionCount: input.questions.length,
        totalPoints,
        coinsPerPoint: input.coinsPerPoint,
        xpReward: input.xpReward ?? (totalPoints * 10 || 100),
        settings: JSON.stringify(input.settings ?? {}),
        updatedAt: now,
      })
      .where(eq(quizzes.id, quizId));

    // Delete existing questions & answer keys
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    await db.delete(quizAnswerKeys).where(eq(quizAnswerKeys.quizId, quizId));

    // Re-insert questions and keys
    for (let i = 0; i < input.questions.length; i++) {
      const q = input.questions[i]!;
      const qId = q.id ?? `q_${i + 1}`;

      await db.insert(quizQuestions).values({
        id: qId,
        quizId,
        type: q.type,
        prompt: q.prompt,
        imageUrl: q.imageUrl ?? null,
        options: JSON.stringify(q.options),
        points: q.points,
        orderIndex: i,
        createdAt: now,
      });

      await db.insert(quizAnswerKeys).values({
        quizId,
        questionId: qId,
        correctIndices: JSON.stringify(q.correctIndices),
        explanation: q.explanation ?? null,
      });
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "quiz.update",
      target: quizId,
      details: { title: input.title, status: input.status },
    });

    return jsonOk({ id: quizId });
  });
}

/** DELETE — remove quiz, questions, and live sessions from Cloudflare D1. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;

    const quizRow = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });
    if (!quizRow) throw new ApiError(404, "Quiz not found.");

    await db.delete(quizAnswerKeys).where(eq(quizAnswerKeys.quizId, quizId));
    await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
    await db.delete(liveQuizResponses).where(eq(liveQuizResponses.quizId, quizId));
    await db.delete(liveQuizParticipants).where(eq(liveQuizParticipants.quizId, quizId));
    await db.delete(liveQuizSessions).where(eq(liveQuizSessions.quizId, quizId));
    await db.delete(quizzes).where(eq(quizzes.id, quizId));

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "quiz.delete",
      target: quizId,
      details: { title: quizRow.title },
    });

    return jsonOk({ deleted: true });
  });
}

