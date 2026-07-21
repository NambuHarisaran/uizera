import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { awardCoins } from "@/lib/server/coins";

export const runtime = 'nodejs';

const answerSchema = z.object({
  questionId: z.string(),
  selectedIndex: z.number(),
  answeredAtMs: z.number(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;
    
    const body = await parseBody(req, answerSchema);
    const { questionId, selectedIndex, answeredAtMs } = body;

    const db = adminDb();
    
    // Check answer key
    const answerKeySnap = await db.collection('quizzes').doc(quizId).collection('answerKey').doc('main').get();
    if (!answerKeySnap.exists) {
      throw new ApiError(404, "Answer key not found");
    }
    const answerKey = answerKeySnap.data()?.answers;
    const questionInfo = answerKey?.[questionId];
    if (!questionInfo) {
      throw new ApiError(404, "Question not found in answer key");
    }
    
    // Check live session
    const sessionSnap = await db.collection('liveQuizSessions').doc(quizId).get();
    if (!sessionSnap.exists) {
      throw new ApiError(404, "Live session not found");
    }
    const session = sessionSnap.data()!;
    
    // Check user profile
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userData = userSnap.data();
    const displayName = userData?.displayName || "Participant";
    const photoURL = userData?.photoURL || null;

    // Check if already answered
    const answerRef = db.collection('liveQuizSessions').doc(quizId).collection('answers').doc(user.uid);
    
    const result = await db.runTransaction(async (tx) => {
      const answerDoc = await tx.get(answerRef);
      const existingData = answerDoc.data();
      const previousTotalCoins = existingData?.totalCoins || 0;
      const existingAnswers = existingData?.answers || {};
      
      if (existingAnswers[questionId]) {
        return {
          alreadyAnswered: true,
          ...existingAnswers[questionId]
        };
      }
      
      const isCorrect = questionInfo.correct.includes(selectedIndex);
      const quizSnap = await tx.get(db.collection('quizzes').doc(quizId));
      const quiz = quizSnap.data() || {};
      const coinsPerPoint = quiz.coinsPerPoint || 1;
      
      const responseTimeMs = answeredAtMs - session.questionStartAtMs;
      const questionDurationSeconds = session.questionDurationSeconds || 30;
      
      const speedMultiplier = Math.max(0.1, 1 - (responseTimeMs / (questionDurationSeconds * 1000)));
      
      let coinsEarned = 0;
      if (isCorrect) {
        coinsEarned = Math.round((questionInfo.points || 0) * coinsPerPoint * speedMultiplier);
      }
      
      const answerData = {
        selectedIndex,
        correct: isCorrect,
        coinsEarned,
        answeredAtMs,
        responseTimeMs,
      };
      
      const newTotalCoins = previousTotalCoins + coinsEarned;
      
      const newDocData = {
        uid: user.uid,
        displayName,
        photoURL,
        answers: {
          [questionId]: answerData
        },
        totalCoins: newTotalCoins,
        updatedAt: FieldValue.serverTimestamp()
      };
      
      tx.set(answerRef, newDocData, { merge: true });
      
      return { 
        answerData, 
        newTotalCoins, 
        coinsEarned,
        correctIndices: questionInfo.correct,
        alreadyAnswered: false
      };
    });
    
    if (result.alreadyAnswered) {
      return jsonOk(result);
    }
    
    if (result.coinsEarned > 0) {
      try {
        await awardCoins({
          uid: user.uid,
          amount: result.coinsEarned,
          xpAmount: 0,
          source: 'quiz',
          reason: `Live Quiz: ${quizId}`,
          refId: `${quizId}_${questionId}_${user.uid}`,
          awardedBy: "system",
          counters: {},
        });
      } catch (e) {
        console.error("[live-quiz-answer] coin award failed:", e);
      }
    }
    
    return jsonOk({
      correct: result.answerData.correct,
      coinsEarned: result.answerData.coinsEarned,
      responseTimeMs: result.answerData.responseTimeMs,
      totalCoins: result.newTotalCoins,
      correctIndices: result.correctIndices,
    });
  });
}
