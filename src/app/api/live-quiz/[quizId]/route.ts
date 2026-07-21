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

    // Fetch live answers leaderboard
    const answersSnap = await db
      .collection('liveQuizSessions')
      .doc(quizId)
      .collection('answers')
      .orderBy('totalCoins', 'desc')
      .limit(20)
      .get();

    const leaderboard = answersSnap.docs.map((d) => {
      const data = d.data();
      return {
        uid: data.uid,
        displayName: data.displayName || 'Participant',
        photoURL: data.photoURL || null,
        score: data.totalCoins || 0,
        answers: data.answers || {},
      };
    });

    // Include answer key for admin (check role)
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userRole = userSnap.data()?.role;
    let answerKey: Record<string, { correct: number[]; explanation: string }> | null = null;
    if (userRole === 'admin' || userRole === 'super_admin') {
      const keySnap = await db.collection('quizzes').doc(quizId).collection('answerKey').doc('main').get();
      if (keySnap.exists) {
        answerKey = keySnap.data()?.answers ?? null;
      }
    }

    return jsonOk({
      quiz: { id: quizSnap.id, ...quizSnap.data() },
      session,
      questions,
      currentQuestion: questions[session.currentQuestionIndex] || null,
      leaderboard,
      userUid: user.uid,
      answerKey,
    });
  });
}
