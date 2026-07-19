import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    const db = adminDb();
    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    if (!quizSnap.exists) {
      return jsonOk({ error: "Quiz not found" }, { status: 404 });
    }

    const sessionSnap = await db.collection("liveQuizSessions").doc(quizId).get();
    const session = sessionSnap.data() || {
      quizId,
      status: "waiting",
      currentQuestionIndex: 0,
      revealAnswer: false,
    };

    const questionsSnap = await db
      .collection("quizzes")
      .doc(quizId)
      .collection("questions")
      .orderBy("publicDoc.order")
      .get();

    const questions = questionsSnap.docs.map((d) => {
      const p = d.data().publicDoc;
      return {
        id: d.id,
        type: p.type,
        prompt: p.prompt,
        imageUrl: p.imageUrl,
        options: p.options,
        points: p.points,
      };
    });

    // Fetch attempts for live stage leaderboard
    const attemptsSnap = await db
      .collection("quizAttempts")
      .where("quizId", "==", quizId)
      .get();

    const leaderboard = attemptsSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          uid: data.uid,
          displayName: data.displayName || "Participant",
          score: data.score || 0,
          maxScore: data.maxScore || 100,
          completedAt: data.completedAt?.toMillis?.() || 0,
        };
      })
      .sort((a, b) => b.score - a.score || a.completedAt - b.completedAt)
      .slice(0, 10);

    return jsonOk({
      quiz: { id: quizSnap.id, ...quizSnap.data() },
      session,
      questions,
      currentQuestion: questions[session.currentQuestionIndex] || null,
      leaderboard,
      userUid: user.uid,
    });
  });
}
