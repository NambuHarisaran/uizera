import { NextResponse } from "next/server";
import { and, desc, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes } from "@/lib/db/schema";
import { handleApi } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/quiz — list published quizzes (scheduled | live | closed).
 * Queries Cloudflare D1 with edge caching.
 */
export async function GET() {
  return handleApi(async () => {
    const rows = await db.query.quizzes.findMany({
      where: and(
        inArray(quizzes.status, ["scheduled", "live", "closed"]),
        ne(quizzes.mode, "live")
      ),
      orderBy: [desc(quizzes.startAt)],
      limit: 100,
    });

    const formatted = rows.map((q) => {
      let settings: any = {};
      try {
        settings = JSON.parse(q.settings ?? "{}");
      } catch {
        settings = {};
      }
      return {
        id: q.id,
        title: q.title,
        description: q.description ?? "",
        coverImage: q.coverImage ?? undefined,
        status: q.status,
        mode: q.mode,
        startAt: q.startAt ? new Date(q.startAt) : null,
        endAt: q.endAt ? new Date(q.endAt) : null,
        durationSeconds: q.durationSeconds,
        questionCount: q.questionCount,
        totalPoints: q.totalPoints,
        coinsPerPoint: q.coinsPerPoint,
        xpReward: q.xpReward,
        settings,
        createdBy: q.createdBy,
        hostUid: q.hostUid ?? undefined,
        hostDisplayName: q.hostDisplayName ?? undefined,
        createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
        updatedAt: q.updatedAt ? new Date(q.updatedAt) : new Date(),
      };
    });

    return NextResponse.json(
      { ok: true, data: { quizzes: formatted } },
      { headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=5" } }
    );
  });
}

