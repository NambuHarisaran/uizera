import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";

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
      await sessionRef.set({
        quizId,
        quizTitle: quizData.title,
        status: "waiting",
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
      await quizRef.update({ status: "closed" });
      await sessionRef.set(
        {
          status: "ended",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
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
