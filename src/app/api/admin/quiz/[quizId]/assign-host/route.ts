import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { quizzes, users } from "@/lib/db/schema";
import { ApiError, assertSameOrigin, handleApi, jsonOk, parseBody, requireAdmin } from "@/lib/server/api";
import { audit } from "@/lib/server/audit";

export const runtime = "nodejs";

const assignHostSchema = z.object({
  /** UID of the quiz_host user to assign. Pass null to remove the host. */
  hostUid: z.string().nullable(),
});

/**
 * PATCH /api/admin/quiz/[quizId]/assign-host
 * Assigns (or removes) a quiz host to the given quiz in Cloudflare D1.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;
    const { hostUid } = await parseBody(req, assignHostSchema);

    const quizRow = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
    });
    if (!quizRow) throw new ApiError(404, "Quiz not found.");

    let hostDisplayName: string | null = null;

    if (hostUid !== null) {
      const userRow = await db.query.users.findFirst({
        where: eq(users.uid, hostUid),
      });
      if (!userRow) throw new ApiError(404, "User not found.");
      if (!["quiz_host", "admin", "super_admin"].includes(userRow.role)) {
        throw new ApiError(400, "User must have the quiz_host role to be assigned as a host.");
      }
      hostDisplayName = userRow.displayName ?? null;
    }

    const now = Date.now();
    await db
      .update(quizzes)
      .set({
        hostUid: hostUid ?? null,
        hostDisplayName: hostDisplayName ?? null,
        updatedAt: now,
      })
      .where(eq(quizzes.id, quizId));

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: hostUid ? "quiz.assign_host" : "quiz.remove_host",
      target: quizId,
      details: { hostUid, hostDisplayName },
    });

    return jsonOk({ hostUid, hostDisplayName });
  });
}

