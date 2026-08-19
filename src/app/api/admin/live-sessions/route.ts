import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, liveQuizSessions, liveQuizParticipants } from "@/lib/db/schema";
import { handleApi, jsonOk, requireAdmin } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/live-sessions
 * Returns all live quizzes merged with live session status from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();

    const liveQuizzes = await db.query.quizzes.findMany({
      where: eq(quizzes.status, "live"),
      orderBy: [desc(quizzes.updatedAt)],
    });

    const sessions = await Promise.all(
      liveQuizzes.map(async (quiz) => {
        const [session, participants] = await Promise.all([
          db.query.liveQuizSessions.findFirst({
            where: eq(liveQuizSessions.quizId, quiz.id),
          }),
          db.query.liveQuizParticipants.findMany({
            where: and(
              eq(liveQuizParticipants.quizId, quiz.id),
              eq(liveQuizParticipants.kicked, false)
            ),
          }),
        ]);

        return {
          quiz,
          session,
          participantCount: participants.length,
        };
      })
    );

    return jsonOk({ sessions });
  });
}

