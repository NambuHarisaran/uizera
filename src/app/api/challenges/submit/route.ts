import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { challengeSubmitSchema } from "@/lib/validation";
import { toMillis } from "@/lib/utils";
import type { Challenge, ChallengeSubmission } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/challenges/submit
 *
 * Creates or updates the caller's single submission for a challenge.
 * - One submission per student per challenge (deterministic doc ID).
 * - Editable until the deadline; every edit resets review status to pending
 *   and appends to an immutable history array.
 * - Any referenced storage file must live under the caller's own folder —
 *   a student can never attach another student's upload.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`challenge-submit:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await parseBody(req, challengeSubmitSchema);

    // Ownership check on the storage path (matches storage.rules layout).
    const ownPrefix = `submissions/${user.uid}/${body.challengeId}/`;
    if (body.filePath && !body.filePath.startsWith(ownPrefix)) {
      throw new ApiError(403, "Attached file is outside your submission folder.");
    }
    if (
      body.fileUrl &&
      !body.fileUrl.includes(encodeURIComponent(ownPrefix)) &&
      !body.fileUrl.includes(ownPrefix)
    ) {
      throw new ApiError(403, "Attached file is outside your submission folder.");
    }

    const db = adminDb();
    const challengeRef = db.collection("challenges").doc(body.challengeId);
    const submissionRef = db
      .collection("submissions")
      .doc(`${body.challengeId}_${user.uid}`);

    const profile = await db.collection("users").doc(user.uid).get();
    const displayName =
      (profile.data()?.displayName as string | undefined) ?? "Member";

    await db.runTransaction(async (tx) => {
      const challengeSnap = await tx.get(challengeRef);
      if (!challengeSnap.exists) throw new ApiError(404, "Challenge not found.");
      const challenge = challengeSnap.data() as Challenge;

      if (challenge.status !== "open") {
        throw new ApiError(400, "This challenge is not accepting submissions.");
      }
      if (Date.now() > toMillis(challenge.deadline)) {
        throw new ApiError(400, "The deadline for this challenge has passed.");
      }

      const existingSnap = await tx.get(submissionRef);
      const historyItem = {
        at: new Date(),
        action: existingSnap.exists ? "updated" : "submitted",
        by: user.uid,
        note: null,
      };

      if (existingSnap.exists) {
        const existing = existingSnap.data() as ChallengeSubmission;
        if (existing.status === "approved") {
          throw new ApiError(400, "Approved submissions can no longer be edited.");
        }
        tx.update(submissionRef, {
          fileUrl: body.fileUrl ?? null,
          filePath: body.filePath ?? null,
          link: body.link ?? null,
          notes: body.notes ?? null,
          status: "pending",
          feedback: null,
          displayName,
          updatedAt: FieldValue.serverTimestamp(),
          history: FieldValue.arrayUnion(historyItem),
        });
      } else {
        tx.set(submissionRef, {
          challengeId: body.challengeId,
          challengeTitle: challenge.title,
          uid: user.uid,
          displayName,
          fileUrl: body.fileUrl ?? null,
          filePath: body.filePath ?? null,
          link: body.link ?? null,
          notes: body.notes ?? null,
          status: "pending",
          feedback: null,
          coinsAwarded: 0,
          reviewedBy: null,
          submittedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          history: [historyItem],
        });
      }
    });

    return jsonOk({ id: submissionRef.id, status: "pending" });
  });
}
