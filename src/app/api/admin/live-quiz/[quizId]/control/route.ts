import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { awardCoins } from "@/lib/server/coins";
import { getQuizQuestions } from "@/lib/server/quiz";

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
      await sessionRef.set({
        quizId,
        quizTitle: quizData.title,
        status: "active",
        viewState: "question",
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
          viewState: "question",
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
    } else if (action === "showLeaderboard") {
      await sessionRef.set(
        {
          viewState: "leaderboard",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (action === "hideLeaderboard") {
      await sessionRef.set(
        {
          viewState: "question",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (action === "kickParticipant") {
      if (!targetUid) throw new ApiError(400, "Missing targetUid to kick.");
      // Mark as kicked in participants collection
      const participantRef = sessionRef.collection("participants").doc(targetUid);
      await participantRef.set(
        { kicked: true, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      // Remove any responses
      const responseRef = sessionRef.collection("responses").doc(targetUid);
      await responseRef.delete();
      // Trigger session update
      await sessionRef.set(
        { lastAnswerAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    } else if (action === "end") {
      // Idempotent: a double "End" click must not award coins twice.
      if (currentSession.status !== "ended") {
        await quizRef.update({ status: "closed" });
        await sessionRef.set(
          { status: "ended", viewState: "leaderboard", updatedAt: FieldValue.serverTimestamp() },
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
    } else if (action === "relaunch") {
      await quizRef.update({ status: "live", mode: "live" });
      await sessionRef.set({
        quizId,
        quizTitle: quizData.title,
        status: "waiting",
        viewState: "lobby",
        currentQuestionIndex: 0,
        questionStartAtMs: Date.now(),
        questionDurationSeconds: quizData.durationSeconds || 30,
        revealAnswer: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
      const responsesSnap = await sessionRef.collection("responses").get();
      const batch = db.batch();
      responsesSnap.docs.forEach((d) => batch.delete(d.ref));
      const participantsSnap = await sessionRef.collection("participants").get();
      participantsSnap.docs.forEach((d) => batch.delete(d.ref));
      if (responsesSnap.docs.length > 0 || participantsSnap.docs.length > 0) {
        await batch.commit();
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `live_quiz.${action}`,
      target: quizId,
      details: { questionIndex, targetUid },
    });

    const updatedSessionSnap = await sessionRef.get();
    return jsonOk({ session: updatedSessionSnap.data() });
  });
}
