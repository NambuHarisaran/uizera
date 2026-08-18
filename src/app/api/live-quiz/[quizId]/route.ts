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
      viewState: "lobby",
      currentQuestionIndex: 0,
      revealAnswer: false,
    };

    const questions = (await getQuizQuestions(quizId)).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
    }));

    // Read participants in lobby
    const [responsesSnap, participantsSnap] = await Promise.all([
      sessionRef.collection("responses").get(),
      sessionRef.collection("participants").get(),
    ]);

    const participants = participantsSnap.docs
      .map((d) => {
        const p = d.data();
        return {
          uid: d.id,
          displayName: (p.displayName as string) || "Participant",
          photoURL: (p.photoURL as string) || null,
          kicked: Boolean(p.kicked),
        };
      })
      .filter((p) => !p.kicked);

    const myParticipant = participantsSnap.docs.find((d) => d.id === user.uid)?.data();
    const isKicked = Boolean(myParticipant?.kicked);

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
      .slice(0, 15);

    // Include answer key only for admin
    const userSnap = await db.collection("users").doc(user.uid).get();
    const userRole = userSnap.data()?.role;
    let answerKey: Record<string, { correct: number[]; explanation: string }> | null = null;
    if (userRole === "admin" || userRole === "super_admin") {
      const keySnap = await db
        .collection("quizzes")
        .doc(quizId)
        .collection("answerKey")
        .doc("main")
        .get();
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
        const fullKey = await getAnswerKey(quizId);
        revealedCorrect = fullKey[currentQ.id]?.correct ?? null;
      }
    }

    return jsonOk({
      quiz: { id: quizSnap.id, ...quizSnap.data() },
      session,
      questions,
      currentQuestion: currentQ,
      leaderboard,
      participants,
      isKicked,
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
