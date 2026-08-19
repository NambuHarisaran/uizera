import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizAttempts } from "@/lib/db/schema";
import { ApiError, handleApi, jsonOk, requireUser } from "@/lib/server/api";
import { isAdminRole } from "@/lib/auth/session";
import { getQuizOrThrow } from "@/lib/server/quiz";

export const runtime = "nodejs";

/**
 * GET /api/quiz/[quizId] — quiz detail + the caller's latest attempt from Cloudflare D1.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    const user = await requireUser();
    const { quizId } = await params;

    const quiz = await getQuizOrThrow(quizId);
    if (!isAdminRole(user.role)) {
      if (quiz.status === "draft" || quiz.mode === "live") {
        throw new ApiError(404, "Quiz not found.");
      }
    }

    // Fetch caller's latest attempt for this quiz from D1
    const latestAttempt = await db.query.quizAttempts.findFirst({
      where: and(
        eq(quizAttempts.quizId, quizId),
        eq(quizAttempts.uid, user.uid)
      ),
      orderBy: [desc(quizAttempts.attemptNo)],
    });

    let formattedAttempt: Record<string, unknown> | null = null;
    if (latestAttempt) {
      let answers: any = {};
      let questionOrder: string[] = [];
      let optionOrders: Record<string, number[]> = {};

      try {
        answers = JSON.parse(latestAttempt.answers ?? "{}");
        questionOrder = JSON.parse(latestAttempt.questionOrder ?? "[]");
        optionOrders = JSON.parse(latestAttempt.optionOrders ?? "{}");
      } catch {
        // fallback
      }

      formattedAttempt = {
        ...latestAttempt,
        answers,
        questionOrder,
        optionOrders,
        startedAt: latestAttempt.startedAt ? new Date(latestAttempt.startedAt) : null,
        deadlineAt: latestAttempt.deadlineAt ? new Date(latestAttempt.deadlineAt) : null,
        submittedAt: latestAttempt.submittedAt ? new Date(latestAttempt.submittedAt) : null,
      };
    }

    return jsonOk({ quiz, attempt: formattedAttempt });
  });
}

