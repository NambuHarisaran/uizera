import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challenges, challengeSubmissions } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { awardCoins } from "@/lib/server/coins";
import { audit } from "@/lib/server/audit";
import { submissionReviewSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/submissions/[submissionId]/review
 * Approve or reject a submission in Cloudflare D1 and award coins + XP.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { submissionId } = await params;
    const body = await parseBody(req, submissionReviewSchema);

    const submission = await db.query.challengeSubmissions.findFirst({
      where: eq(challengeSubmissions.id, submissionId),
    });

    if (!submission) throw new ApiError(404, "Submission not found.");
    if (submission.status !== "pending") {
      throw new ApiError(400, "Only pending submissions can be reviewed.");
    }

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, submission.challengeId),
    });

    const coins =
      body.decision === "approved"
        ? Math.max(0, body.coins ?? challenge?.coins ?? 0)
        : 0;

    const xp =
      body.decision === "approved"
        ? Math.max(0, challenge?.xp ?? 150)
        : 0;

    const now = Date.now();
    let history: any[] = [];
    try {
      history = JSON.parse(submission.history ?? "[]");
    } catch {}

    history.push({
      at: now,
      action: body.decision,
      by: admin.uid,
      note: body.feedback || null,
    });

    await db
      .update(challengeSubmissions)
      .set({
        status: body.decision,
        feedback: body.feedback || null,
        coinsAwarded: coins,
        reviewedBy: admin.uid,
        updatedAt: now,
        history: JSON.stringify(history),
      })
      .where(eq(challengeSubmissions.id, submissionId));

    let newBadges: string[] = [];
    if (body.decision === "approved") {
      try {
        const award = await awardCoins({
          uid: submission.uid,
          amount: coins,
          xpAmount: xp,
          source: "weekly_task",
          reason: `Challenge approved: ${submission.challengeTitle}`,
          refId: submissionId,
          awardedBy: admin.uid,
          counters: { challengesApproved: 1 },
        });
        newBadges = award.newBadges;
      } catch (err) {
        console.error("[review] award failed, reverting approval:", err);
        await db
          .update(challengeSubmissions)
          .set({ status: "pending", reviewedBy: null, coinsAwarded: 0 })
          .where(eq(challengeSubmissions.id, submissionId));
        throw new ApiError(500, "Could not award coins — review was not saved.");
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `submission.${body.decision}`,
      target: submissionId,
      details: {
        studentUid: submission.uid,
        coins,
      },
    });

    return jsonOk({ status: body.decision, coins, newBadges });
  });
}
