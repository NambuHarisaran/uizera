import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { getQuizOrThrow } from "@/lib/server/quiz";
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId]/leaderboard
 * Per-quiz standings (separate from the global leaderboard): best submitted
 * attempt per member, ranked by score then fastest submission.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    await requireUser();
    const { quizId } = await params;
    const quiz = await getQuizOrThrow(quizId);

    const snap = await adminDb()
      .collection("quizAttempts")
      .where("quizId", "==", quizId)
      .orderBy("score", "desc")
      .orderBy("submittedAt", "asc")
      .limit(200)
      .get();

    const seen = new Set<string>();
    const rows: Array<{
      rank: number;
      uid: string;
      displayName: string;
      score: number;
      maxScore: number;
      coinsEarned: number;
      submittedAt: number;
    }> = [];

    for (const doc of snap.docs) {
      const a = doc.data() as QuizAttempt;
      if (a.status !== "submitted" || seen.has(a.uid)) continue;
      seen.add(a.uid);
      rows.push({
        rank: rows.length + 1,
        uid: a.uid,
        displayName: a.displayName || "Member",
        score: a.score,
        maxScore: a.maxScore,
        coinsEarned: a.coinsEarned,
        submittedAt: toMillis(a.submittedAt),
      });
      if (rows.length >= 50) break;
    }

    return jsonOk({ quizTitle: quiz.title, entries: rows });
  });
}
