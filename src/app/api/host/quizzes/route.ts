import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes } from "@/lib/db/schema";
import { handleApi, jsonOk, requireQuizHost } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/host/quizzes
 * Returns all quizzes where hostUid === the signed-in user from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireQuizHost();

    const hostQuizzes = await db.query.quizzes.findMany({
      where: eq(quizzes.hostUid, user.uid),
      orderBy: [desc(quizzes.updatedAt)],
    });

    return jsonOk({ quizzes: hostQuizzes });
  });
}

