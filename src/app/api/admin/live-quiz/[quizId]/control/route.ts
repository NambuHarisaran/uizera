import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  quizzes,
  liveQuizSessions,
  liveQuizParticipants,
  liveQuizResponses,
} from "@/lib/db/schema";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { endLiveQuizSession } from "@/lib/server/live-quiz";

export const runtime = "nodejs";

const controlSchema = z.object({
  action: z.enum([
    "start",
    "setQuestion",
    "toggleAnswer",
    "showLeaderboard",
    "hideLeaderboard",
    "kickParticipant",
    "end",
    "relaunch",
  ]),
  questionIndex: z.number().int().min(0).optional(),
  targetUid: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;
    const { action, questionIndex, targetUid } = await parseBody(req, controlSchema);

    const quizData = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });

    if (!quizData) {
      throw new ApiError(404, "Quiz not found.");
    }

    const currentSession = await db.query.liveQuizSessions.findFirst({
      where: eq(liveQuizSessions.quizId, quizId),
    });

    const now = Date.now();
    const liveQuestionDuration = (quizData.settings as any)?.liveQuestionDurationSeconds ?? 30;

    if (action === "start") {
      await db.update(quizzes).set({ status: "live", mode: "live", updatedAt: now }).where(eq(quizzes.id, quizId));
      if (currentSession) {
        await db
          .update(liveQuizSessions)
          .set({
            status: "active",
            viewState: "question",
            currentQuestionIndex: 0,
            questionStartAtMs: now,
            questionDurationSeconds: liveQuestionDuration,
            revealAnswer: false,
            updatedAt: now,
          })
          .where(eq(liveQuizSessions.quizId, quizId));
      } else {
        await db.insert(liveQuizSessions).values({
          quizId,
          quizTitle: quizData.title,
          status: "active",
          viewState: "question",
          currentQuestionIndex: 0,
          questionStartAtMs: now,
          questionDurationSeconds: liveQuestionDuration,
          revealAnswer: false,
          updatedAt: now,
        });
      }

    } else if (action === "setQuestion") {
      const idx = questionIndex ?? 0;
      await db
        .update(liveQuizSessions)
        .set({
          status: "active",
          viewState: "question",
          currentQuestionIndex: idx,
          questionStartAtMs: now,
          revealAnswer: false,
          updatedAt: now,
        })
        .where(eq(liveQuizSessions.quizId, quizId));
    } else if (action === "toggleAnswer") {
      await db
        .update(liveQuizSessions)
        .set({
          revealAnswer: !currentSession?.revealAnswer,
          updatedAt: now,
        })
        .where(eq(liveQuizSessions.quizId, quizId));
    } else if (action === "showLeaderboard") {
      await db
        .update(liveQuizSessions)
        .set({
          viewState: "leaderboard",
          updatedAt: now,
        })
        .where(eq(liveQuizSessions.quizId, quizId));
    } else if (action === "hideLeaderboard") {
      await db
        .update(liveQuizSessions)
        .set({
          viewState: "question",
          updatedAt: now,
        })
        .where(eq(liveQuizSessions.quizId, quizId));
    } else if (action === "kickParticipant") {
      if (!targetUid) throw new ApiError(400, "Missing targetUid to kick.");
      await db
        .update(liveQuizParticipants)
        .set({ kicked: true })
        .where(
          and(
            eq(liveQuizParticipants.quizId, quizId),
            eq(liveQuizParticipants.uid, targetUid)
          )
        );
      await db
        .delete(liveQuizResponses)
        .where(
          and(
            eq(liveQuizResponses.quizId, quizId),
            eq(liveQuizResponses.uid, targetUid)
          )
        );
      await db
        .update(liveQuizSessions)
        .set({ lastAnswerAt: now, updatedAt: now })
        .where(eq(liveQuizSessions.quizId, quizId));
    } else if (action === "end") {
      if (currentSession?.status !== "ended") {
        await endLiveQuizSession(quizId, quizData);
      }
    } else if (action === "relaunch") {
      await db.update(quizzes).set({ status: "live", mode: "live", updatedAt: now }).where(eq(quizzes.id, quizId));
      if (currentSession) {
        await db
          .update(liveQuizSessions)
          .set({
            status: "waiting",
            viewState: "lobby",
            currentQuestionIndex: 0,
            questionStartAtMs: now,
            questionDurationSeconds: quizData.durationSeconds || 30,
            revealAnswer: false,
            updatedAt: now,
          })
          .where(eq(liveQuizSessions.quizId, quizId));
      }
      await db.delete(liveQuizResponses).where(eq(liveQuizResponses.quizId, quizId));
      await db.delete(liveQuizParticipants).where(eq(liveQuizParticipants.quizId, quizId));
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `live_quiz.${action}`,
      target: quizId,
      details: { questionIndex, targetUid },
    });

    const updatedSession = await db.query.liveQuizSessions.findFirst({
      where: eq(liveQuizSessions.quizId, quizId),
    });
    return jsonOk({ session: updatedSession });
  });
}

