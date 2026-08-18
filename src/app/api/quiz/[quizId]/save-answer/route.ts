import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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
import { toMillis } from "@/lib/utils";
import type { QuizAttempt } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 5;

/**
 * PATCH /api/quiz/[quizId]/save-answer
 *
 * Persists partial answers mid-attempt without submitting.
 * Called client-side on every selection change (debounced ~800ms).
 *
 * This is a best-effort save — a failed call is silently ignored on the client.
 * The submit route is the authoritative source of truth. This only ensures
 * answers survive a hard refresh or browser crash mid-quiz.
 *
 * Guards:
 *   - Attempt must belong to the caller (encoded in attemptId)
 *   - Attempt must be in_progress
 *   - Deadline must not have passed (using the same grace window as submit)
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

    const db = adminDb();
    const attemptRef = db.collection("quizAttempts").doc(body.attemptId);
    const snap = await attemptRef.get();

    if (!snap.exists) throw new ApiError(404, "Attempt not found.");
    const attempt = snap.data() as QuizAttempt;

    if (attempt.uid !== user.uid) {
      throw new ApiError(403, "This attempt does not belong to you.");
    }
    if (attempt.status !== "in_progress") {
      // Already submitted or expired — silently accept so the client
      // doesn't surface an error on the debounced trailing call.
      return jsonOk({ saved: false, reason: "attempt_not_active" });
    }

    const now = Date.now();
    if (now > toMillis(attempt.deadlineAt) + 15_000) {
      return jsonOk({ saved: false, reason: "deadline_passed" });
    }

    await attemptRef.update({ answers: body.answers });

    return jsonOk({ saved: true });
  });
}
