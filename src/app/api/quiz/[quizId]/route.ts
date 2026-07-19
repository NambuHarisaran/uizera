import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { isAdminRole } from "@/lib/auth/session";
import { getQuizOrThrow } from "@/lib/server/quiz";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId] — quiz detail + the caller's latest attempt.
 * Drafts stay invisible to students; admins may preview them.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    const quiz = await getQuizOrThrow(quizId);
    if (quiz.status === "draft" && !isAdminRole(user.role)) {
      throw new ApiError(404, "Quiz not found.");
    }

    // Latest attempt lives at a deterministic id derived from the per-user
    // counter, so no composite index is needed.
    const counterSnap = await adminDb()
      .collection("quizzes")
      .doc(quizId)
      .collection("attemptCounters")
      .doc(user.uid)
      .get();
    const count = (counterSnap.data()?.count as number | undefined) ?? 0;

    let attempt: Record<string, unknown> | null = null;
    if (count > 0) {
      const attemptSnap = await adminDb()
        .collection("quizAttempts")
        .doc(`${quizId}_${user.uid}_${count}`)
        .get();
      if (attemptSnap.exists) {
        attempt = { id: attemptSnap.id, ...attemptSnap.data() };
      }
    }

    return jsonOk({ quiz, attempt });
  });
}
