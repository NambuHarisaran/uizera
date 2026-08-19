import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, quizQuestions, quizAnswerKeys } from "@/lib/db/schema";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { quizUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** GET /api/admin/quizzes — full list including drafts from Cloudflare D1. */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();
    const rows = await db.query.quizzes.findMany({
      orderBy: [desc(quizzes.startAt)],
      limit: 200,
    });

    const formatted = rows.map((q) => {
      let settings: any = {};
      try {
        settings = JSON.parse(q.settings ?? "{}");
      } catch {}
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        coverImage: q.coverImage,
        status: q.status,
        mode: q.mode,
        startAt: q.startAt ? new Date(q.startAt) : null,
        endAt: q.endAt ? new Date(q.endAt) : null,
        durationSeconds: q.durationSeconds,
        questionCount: q.questionCount,
        totalPoints: q.totalPoints,
        coinsPerPoint: q.coinsPerPoint,
        xpReward: q.xpReward,
        settings,
        createdBy: q.createdBy,
        hostUid: q.hostUid,
        hostDisplayName: q.hostDisplayName,
        createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
        updatedAt: q.updatedAt ? new Date(q.updatedAt) : new Date(),
      };
    });

    return jsonOk({ quizzes: formatted });
  });
}

/** POST /api/admin/quizzes — create quiz + questions + private answer key in Cloudflare D1. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const input = await parseBody(req, quizUpsertSchema);

    const now = Date.now();
    const quizId = `quiz_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const totalPoints = input.questions.reduce((s: number, q: any) => s + (q.points ?? 0), 0);

    // Insert quiz row
    await db.insert(quizzes).values({
      id: quizId,
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
      createdBy: admin.uid,
      createdAt: now,
      updatedAt: now,
    });

    // Insert questions and answer keys
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
      action: "quiz.create",
      target: quizId,
      details: { title: input.title, questions: input.questions.length },
    });

    return jsonOk({ id: quizId });
  });
}

