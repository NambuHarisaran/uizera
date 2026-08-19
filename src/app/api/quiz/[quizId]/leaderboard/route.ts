import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts } from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { getQuizOrThrow } from "@/lib/server/quiz";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId]/leaderboard
 * Per-quiz standings from Cloudflare D1.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    await requireUser();
    const { quizId } = await params;
    const quiz = await getQuizOrThrow(quizId);

    // Fetch all submitted attempts for this quiz from D1
    const attempts = await db.query.quizAttempts.findMany({
      where: and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.status, "submitted")
      ),
      orderBy: [desc(quizAttempts.score)],
      limit: 200,
    });

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

    for (const a of attempts) {
      if (seen.has(a.uid)) continue;
      seen.add(a.uid);

      const timeTakenMs = a.submittedAt && a.startedAt ? a.submittedAt - a.startedAt : Infinity;
      candidates.push({
        uid: a.uid,
        displayName: a.displayName || "Member",
        score: a.score,
        maxScore: a.maxScore,
        coinsEarned: a.coinsEarned,
        timeTakenMs,
        submittedAt: a.submittedAt ?? a.startedAt,
      });
    }

    candidates.sort((a, b) => b.score - a.score || a.timeTakenMs - b.timeTakenMs);

    let denseRank = 1;
    const ranked = candidates.slice(0, 50).map((c, i, arr) => {
      if (i > 0) {
        const prev = arr[i - 1]!;
        if (prev.score !== c.score || prev.timeTakenMs !== c.timeTakenMs) {
          denseRank = i + 1;
        }
      }
      return { rank: denseRank, ...c };
    });

    return jsonOk({ quizTitle: quiz.title, entries: ranked });
  });
}

