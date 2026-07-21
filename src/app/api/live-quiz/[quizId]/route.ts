import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { isAdminRole } from "@/lib/auth/session";
import { getAnswerKey, getQuizQuestions } from "@/lib/server/quiz";

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

    const sessionRef = db.collection("liveQuizSessions").doc(quizId);
    const sessionSnap = await sessionRef.get();
    const session = sessionSnap.data() || {
      quizId,
      status: "waiting",
      currentQuestionIndex: 0,
      revealAnswer: false,
    };

    // Question docs are stored flat (order/prompt/options at the top level —
    // see buildQuizDocs in lib/server/quiz.ts). A prior version of this route
    // queried orderBy("publicDoc.order") and read d.data().publicDoc, a field
    // that never existed on these docs; Firestore silently drops every doc
    // missing the ordered field, so the stage always showed "0 questions".
    const questions = (await getQuizQuestions(quizId)).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
    }));

    // Single read of every participant's response doc — powers the
    // leaderboard, "how many have answered" count, and (once revealed or for
    // the host) the live answer-distribution bars.
    const responsesSnap = await sessionRef.collection("responses").get();

    const leaderboard = responsesSnap.docs
      .map((d) => {
        const r = d.data();
        return {
          uid: d.id,
          displayName: (r.displayName as string) || "Participant",
          score: (r.totalScore as number) || 0,
          totalCoins: (r.totalScore as number) || 0,
          answers: r.answers || {},
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

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

    const currentQ = questions[session.currentQuestionIndex] || null;
    const isPrivileged = isAdminRole(user.role);

    const myDoc = responsesSnap.docs.find((d) => d.id === user.uid);
    const myAnswers = (myDoc?.data()?.answers ?? {}) as Record<
      string,
      { selected: number[]; correct: boolean; points: number }
    >;
    const myScore = (myDoc?.data()?.totalScore as number) || 0;

    let answeredCount = 0;
    let optionCounts: number[] | null = null;
    let revealedCorrect: number[] | null = null;

    if (currentQ) {
      answeredCount = responsesSnap.docs.filter(
        (d) => (d.data()?.answers ?? {})[currentQ.id]
      ).length;

      if (isPrivileged || session.revealAnswer) {
        optionCounts = new Array(currentQ.options.length).fill(0);
        for (const d of responsesSnap.docs) {
          const ans = (d.data()?.answers ?? {})[currentQ.id];
          if (ans?.selected) {
            for (const idx of ans.selected as number[]) {
              if (typeof idx === "number" && optionCounts[idx] !== undefined) {
                optionCounts[idx] += 1;
              }
            }
          }
        }
      }

      if (session.revealAnswer) {
        const answerKey = await getAnswerKey(quizId);
        revealedCorrect = answerKey[currentQ.id]?.correct ?? null;
      }
    }

    return jsonOk({
      quiz: { id: quizSnap.id, ...quizSnap.data() },
      session,
      questions,
      currentQuestion: currentQ,
      leaderboard,
      myAnswers,
      myScore,
      answeredCount,
      optionCounts,
      revealedCorrect,
      userUid: user.uid,
      answerKey,
    });
  });
}
