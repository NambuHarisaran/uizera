import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  quizzes,
  liveQuizSessions,
  liveQuizParticipants,
  liveQuizResponses,
  users,
} from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { isAdminRole } from "@/lib/auth/session";
import { getAnswerKey, getQuizQuestions } from "@/lib/server/quiz";

export const runtime = "nodejs";

import { remember } from "@/lib/server/cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    // Cache the shared stage snapshot across all concurrent participants for 400ms
    const snapshot = await remember(`live_stage_${quizId}`, 400, async () => {
      const quizRow = await db.query.quizzes.findFirst({
        where: eq(quizzes.id, quizId),
      });
      if (!quizRow) return null;

      const sessionRow = await db.query.liveQuizSessions.findFirst({
        where: eq(liveQuizSessions.quizId, quizId),
      });

      const session = sessionRow
        ? {
            quizId: sessionRow.quizId,
            quizTitle: sessionRow.quizTitle,
            status: sessionRow.status as "waiting" | "active" | "ended",
            viewState: sessionRow.viewState as "lobby" | "question" | "leaderboard",
            currentQuestionIndex: sessionRow.currentQuestionIndex,
            questionStartAtMs: sessionRow.questionStartAtMs,
            questionDurationSeconds: sessionRow.questionDurationSeconds,
            revealAnswer: Boolean(sessionRow.revealAnswer),
            lastAnswerAt: sessionRow.lastAnswerAt,
            updatedAt: sessionRow.updatedAt,
          }
        : {
            quizId,
            quizTitle: quizRow.title,
            status: "waiting" as const,
            viewState: "lobby" as const,
            currentQuestionIndex: 0,
            questionStartAtMs: 0,
            questionDurationSeconds: 30,
            revealAnswer: false,
            lastAnswerAt: null,
            updatedAt: Date.now(),
          };

      const questions = await getQuizQuestions(quizId);

      const [participantsRows, responsesRows] = await Promise.all([
        db.query.liveQuizParticipants.findMany({
          where: eq(liveQuizParticipants.quizId, quizId),
        }),
        db.query.liveQuizResponses.findMany({
          where: eq(liveQuizResponses.quizId, quizId),
        }),
      ]);

      const participants = participantsRows
        .filter((p) => !p.kicked)
        .map((p) => ({
          uid: p.uid,
          displayName: p.displayName,
          photoURL: p.photoURL,
          kicked: Boolean(p.kicked),
        }));

      const leaderboard = responsesRows
        .map((r) => ({
          uid: r.uid,
          displayName: r.displayName,
          score: r.totalScore,
          totalCoins: r.totalScore,
          totalAnswerMs: r.totalAnswerMs || Infinity,
        }))
        .sort((a, b) => b.score - a.score || a.totalAnswerMs - b.totalAnswerMs)
        .slice(0, 15);

      let rank = 1;
      for (let i = 0; i < leaderboard.length; i++) {
        if (
          i > 0 &&
          (leaderboard[i]!.score !== leaderboard[i - 1]!.score ||
            leaderboard[i]!.totalAnswerMs !== leaderboard[i - 1]!.totalAnswerMs)
        ) {
          rank = i + 1;
        }
        (leaderboard[i] as any).rank = rank;
      }

      const currentQ = questions[session.currentQuestionIndex] || null;

      let answeredCount = 0;
      let optionCounts: number[] | null = null;
      let revealedCorrect: number[] | null = null;

      if (currentQ) {
        answeredCount = responsesRows.filter((r) => {
          try {
            const ans = JSON.parse(r.answers ?? "{}");
            return Boolean(ans[currentQ.id]);
          } catch {
            return false;
          }
        }).length;

        if (session.revealAnswer) {
          optionCounts = new Array(currentQ.options.length).fill(0);
          for (const r of responsesRows) {
            try {
              const ans = JSON.parse(r.answers ?? "{}")[currentQ.id];
              if (ans?.selected) {
                for (const idx of ans.selected as number[]) {
                  if (typeof idx === "number" && optionCounts[idx] !== undefined) {
                    optionCounts[idx] += 1;
                  }
                }
              }
            } catch {}
          }

          const fullKey = await getAnswerKey(quizId);
          revealedCorrect = fullKey[currentQ.id]?.correct ?? null;
        }
      }

      return {
        quizRow,
        session,
        questions,
        participants,
        participantsRows,
        responsesRows,
        leaderboard,
        currentQ,
        answeredCount,
        optionCounts,
        revealedCorrect,
      };
    });

    if (!snapshot) {
      return jsonOk({ error: "Quiz not found" }, { status: 404 });
    }

    const {
      quizRow,
      session,
      questions,
      participants,
      participantsRows,
      responsesRows,
      leaderboard,
      currentQ,
      answeredCount,
      optionCounts,
      revealedCorrect,
    } = snapshot;

    const [userRow] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.uid, user.uid),
      }),
    ]);

    const myParticipant = participantsRows.find((p) => p.uid === user.uid);
    const isKicked = Boolean(myParticipant?.kicked);

    const userRole = userRow?.role;
    const isAssignedHost = userRole === "quiz_host" && quizRow.hostUid === user.uid;
    const isPrivileged = isAdminRole(userRole as any) || isAssignedHost;

    let answerKey: Record<string, { correct: number[]; explanation: string }> | null = null;
    if (isPrivileged) {
      const fullKey = await getAnswerKey(quizId);
      answerKey = fullKey as any;
    }

    const myResponse = responsesRows.find((r) => r.uid === user.uid);
    let myAnswers: Record<string, { selected: number[]; correct: boolean; points: number }> = {};
    try {
      myAnswers = JSON.parse(myResponse?.answers ?? "{}");
    } catch {}
    const myScore = myResponse?.totalScore ?? 0;

    // Sanitize myAnswers so player cannot know correctness for active question before reveal
    const sanitizedMyAnswers: Record<string, { selected: number[]; correct: boolean; points: number }> = { ...myAnswers };
    if (!session.revealAnswer && !isPrivileged && currentQ && sanitizedMyAnswers[currentQ.id]) {
      sanitizedMyAnswers[currentQ.id] = {
        selected: sanitizedMyAnswers[currentQ.id].selected,
        correct: false,
        points: 0,
      };
    }

    // Anti-cheat: Do not reveal future questions to participants in live stage
    const safeQuestions = isPrivileged
      ? questions
      : session.status === "waiting" || session.viewState === "lobby"
      ? []
      : questions.slice(0, session.currentQuestionIndex + 1);

    return jsonOk({
      quiz: {
        id: quizRow.id,
        title: quizRow.title,
        status: quizRow.status,
        mode: quizRow.mode,
        durationSeconds: quizRow.durationSeconds,
        questionCount: quizRow.questionCount || questions.length,
        hostUid: quizRow.hostUid,
        hostDisplayName: quizRow.hostDisplayName,
      },
      session,
      questions: safeQuestions,
      totalQuestions: questions.length,
      currentQuestion: currentQ,
      leaderboard,
      participants,
      isKicked,
      myAnswers: sanitizedMyAnswers,
      myScore,
      answeredCount,
      optionCounts,
      revealedCorrect,
      userUid: user.uid,
      answerKey,
    });

  });
}

