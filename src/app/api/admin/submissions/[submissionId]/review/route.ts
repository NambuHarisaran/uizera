import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
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
import type { Challenge, ChallengeSubmission } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/admin/submissions/[submissionId]/review
 *
 * Approve or reject a pending submission. Approval awards the challenge's
 * coins (or an admin-supplied override) exactly once: the status flip
 * pending→approved happens in a transaction, so double-clicks and parallel
 * reviewers cannot double-award.
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

    const db = adminDb();
    const submissionRef = db.collection("submissions").doc(submissionId);

    const outcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(submissionRef);
      if (!snap.exists) throw new ApiError(404, "Submission not found.");
      const submission = snap.data() as ChallengeSubmission;

      if (submission.status !== "pending") {
        throw new ApiError(400, "Only pending submissions can be reviewed.");
      }

      const challengeSnap = await tx.get(
        db.collection("challenges").doc(submission.challengeId)
      );
      const challenge = challengeSnap.data() as Challenge | undefined;

      const coins =
        body.decision === "approved"
          ? Math.max(0, body.coins ?? challenge?.coins ?? 0)
          : 0;

      const xp =
        body.decision === "approved"
          ? Math.max(0, challenge?.xp ?? 150)
          : 0;

      tx.update(submissionRef, {
        status: body.decision,
        feedback: body.feedback || null,
        coinsAwarded: coins,
        reviewedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
        history: FieldValue.arrayUnion({
          at: new Date(),
          action: body.decision,
          by: admin.uid,
          note: body.feedback || null,
        }),
      });

      return { submission, coins, xp };
    });

    let newBadges: string[] = [];
    if (body.decision === "approved") {
      try {
        const award = await awardCoins({
          uid: outcome.submission.uid,
          amount: Math.max(1, outcome.coins),
          xpAmount: outcome.xp,
          source: "weekly_task",
          reason: `Challenge approved: ${outcome.submission.challengeTitle}`,
          refId: submissionId,
          awardedBy: admin.uid,
          counters: { challengesApproved: 1 },
        });
        newBadges = award.newBadges;
      } catch (err) {
        // Roll back the approval so a retry can re-run the whole flow.
        console.error("[review] award failed, reverting approval:", err);
        await submissionRef.update({ status: "pending", reviewedBy: null });
        throw new ApiError(500, "Could not award coins — review was not saved.");
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `submission.${body.decision}`,
      target: submissionId,
      details: {
        studentUid: outcome.submission.uid,
        coins: outcome.coins,
      },
    });

    return jsonOk({ status: body.decision, coins: outcome.coins, newBadges });
  });
}
