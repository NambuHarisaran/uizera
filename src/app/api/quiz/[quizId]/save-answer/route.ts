import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { saveAnswerSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * PATCH /api/quiz/[quizId]/save-answer
 * Persists partial answers mid-attempt in Cloudflare D1 without submitting.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;
    rateLimit(`quiz-save:${user.uid}`, { limit: 120, windowMs: 60_000 });

    const body = await parseBody(req, saveAnswerSchema);

    if (!body.attemptId.startsWith(`${quizId}_${user.uid}_`)) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }

    const attempt = await db.query.quizAttempts.findFirst({
      where: eq(quizAttempts.id, body.attemptId),
    });

    if (!attempt) throw new ApiError(404, "Attempt not found.");

    if (attempt.uid !== user.uid) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }
    if (attempt.status !== "in_progress") {
      return jsonOk({ saved: false, reason: "attempt_not_active" });
    }

    const now = Date.now();
    if (now > attempt.deadlineAt + 15_000) {
      return jsonOk({ saved: false, reason: "deadline_passed" });
    }

    await db
      .update(quizAttempts)
      .set({ answers: JSON.stringify(body.answers) })
      .where(eq(quizAttempts.id, body.attemptId));

    return jsonOk({ saved: true });
  });
}

