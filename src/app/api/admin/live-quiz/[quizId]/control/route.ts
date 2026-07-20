import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { awardCoins } from "@/lib/server/coins";
import { getQuizQuestions } from "@/lib/server/quiz";

export const runtime = "nodejs";

const controlSchema = z.object({
  action: z.enum(["start", "setQuestion", "toggleAnswer", "end"]),
  questionIndex: z.number().int().min(0).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;
    const { action, questionIndex } = await parseBody(req, controlSchema);

    const db = adminDb();
    const quizRef = db.collection("quizzes").doc(quizId);
    const quizSnap = await quizRef.get();

    if (!quizSnap.exists) {
      throw new ApiError(404, "Quiz not found.");
    }

    const quizData = quizSnap.data()!;
    const sessionRef = db.collection("liveQuizSessions").doc(quizId);
    const sessionSnap = await sessionRef.get();
    const currentSession = sessionSnap.data() || {};

    if (action === "start") {
      await quizRef.update({ status: "live", mode: "live" });
      // Go straight to the first question — every participant on the
      // waiting screen syncs to it at once. There is no separate "waiting"
      // sub-state after Start; that was leaving the stage stuck forever.
      await sessionRef.set({
        quizId,
        quizTitle: quizData.title,
        status: "active",
        currentQuestionIndex: 0,
        questionStartAtMs: Date.now(),
        questionDurationSeconds: quizData.durationSeconds || 30,
        revealAnswer: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (action === "setQuestion") {
      const idx = questionIndex ?? 0;
      await sessionRef.set(
        {
          quizId,
          quizTitle: quizData.title,
          status: "active",
          currentQuestionIndex: idx,
          questionStartAtMs: Date.now(),
          revealAnswer: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (action === "toggleAnswer") {
      await sessionRef.set(
        {
          revealAnswer: !currentSession.revealAnswer,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (action === "end") {
      // Idempotent: a double "End" click (or the final-question button and a
      // later manual End) must not award coins twice.
      if (currentSession.status !== "ended") {
        await quizRef.update({ status: "closed" });
        await sessionRef.set(
          { status: "ended", updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );

        const questions = await getQuizQuestions(quizId);
        const maxScore = questions.reduce((s, q) => s + q.points, 0);
        const xpRewardTotal = quizData.xpReward ?? (maxScore * 10 || 100);
        const coinsPerPoint = quizData.coinsPerPoint ?? 1;

        const responsesSnap = await sessionRef.collection("responses").get();
        for (const doc of responsesSnap.docs) {
          const score = Math.max(0, Math.min(maxScore, doc.data().totalScore ?? 0));
          if (score <= 0) continue;

          const coinsEarned = Math.round(score * coinsPerPoint);
          const accuracyRatio = maxScore > 0 ? score / maxScore : 0;
          const xpEarned = Math.round(accuracyRatio * xpRewardTotal);
          if (coinsEarned <= 0 && xpEarned <= 0) continue;

          try {
            await awardCoins({
              uid: doc.id,
              amount: Math.max(1, coinsEarned),
              xpAmount: xpEarned,
              source: "quiz",
              reason: `Live Stage Quiz: ${quizData.title}`,
              refId: quizId,
              awardedBy: "system",
              counters: { quizzesTaken: 1 },
            });
          } catch (err) {
            console.error("[live-quiz] award failed for", doc.id, err);
          }
        }
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `live_quiz.${action}`,
      target: quizId,
      details: { questionIndex },
    });

    const updatedSessionSnap = await sessionRef.get();
    return jsonOk({ session: updatedSessionSnap.data() });
  });
}
