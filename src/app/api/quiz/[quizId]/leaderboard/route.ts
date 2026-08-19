import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { getQuizOrThrow } from "@/lib/server/quiz";
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId]/leaderboard
 * Per-quiz standings: best submitted attempt per member, ranked by:
 *   1. score (desc)      — higher is better
 *   2. timeTakenMs (asc) — faster is fairer when scores are equal
 *
 * Dense (Olympic) ranking: tied players share the same rank number.
 * e.g. [100pts 8s, 100pts 9s, 90pts 5s] → ranks [1, 2, 3]
 * e.g. [100pts 8s, 100pts 8s, 90pts 5s] → ranks [1, 1, 2]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    await requireUser();
    const { quizId } = await params;
    const quiz = await getQuizOrThrow(quizId);

    // Fetch all submitted attempts ordered by score desc.
    // The timeTakenMs tiebreak is applied in-memory — this avoids needing a
    // new composite Firestore index, and the 200-doc cap keeps memory trivial.
    const snap = await adminDb()
      .collection("quizAttempts")
      .where("quizId", "==", quizId)
      .where("status", "==", "submitted")
      .orderBy("score", "desc")
      .limit(200)
      .get();

    // Deduplicate: keep only one (best) attempt per user.
    // Since we order by score desc, the first occurrence per uid is the best.
    const seen = new Set<string>();
    const candidates: Array<{
      uid: string;
      displayName: string;
      score: number;
      maxScore: number;
      coinsEarned: number;
      timeTakenMs: number;
      submittedAt: number;
    }> = [];

    for (const doc of snap.docs) {
      const a = doc.data() as QuizAttempt & { timeTakenMs?: number };
      if (seen.has(a.uid)) continue;
      seen.add(a.uid);
      candidates.push({
        uid: a.uid,
        displayName: a.displayName || "Member",
        score: a.score,
        maxScore: a.maxScore,
        coinsEarned: a.coinsEarned,
        // Attempts before timeTakenMs was introduced get Infinity — they sort
        // after players whose speed we do know, which is fair.
        timeTakenMs: typeof a.timeTakenMs === "number" ? a.timeTakenMs : Infinity,
        submittedAt: toMillis(a.submittedAt),
      });
    }

    // In-memory sort: score desc, then timeTakenMs asc (faster wins on a tie).
    candidates.sort((a, b) => b.score - a.score || a.timeTakenMs - b.timeTakenMs);

    // Assign Olympic-style dense ranks: tied players share the same rank.
    let denseRank = 1;
    const ranked = candidates.slice(0, 50).map((c, i, arr) => {
      if (i > 0) {
        const prev = arr[i - 1]!;
        // Only bump rank if this entry is strictly different from the previous
        if (prev.score !== c.score || prev.timeTakenMs !== c.timeTakenMs) {
          denseRank = i + 1;
        }
      }
      return { rank: denseRank, ...c };
    });

    return jsonOk({ quizTitle: quiz.title, entries: ranked });
  });
}
