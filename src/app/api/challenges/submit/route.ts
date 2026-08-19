import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challenges, challengeSubmissions, users } from "@/lib/db/schema";
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

export const runtime = "nodejs";

/**
 * POST /api/challenges/submit
 * Creates or updates the caller's submission for a challenge in Cloudflare D1.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`challenge-submit:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await parseBody(req, challengeSubmitSchema);

    const [challenge, existing, userRecord] = await Promise.all([
      db.query.challenges.findFirst({
        where: eq(challenges.id, body.challengeId),
      }),
      db.query.challengeSubmissions.findFirst({
        where: and(
          eq(challengeSubmissions.challengeId, body.challengeId),
          eq(challengeSubmissions.uid, user.uid)
        ),
      }),
      db.query.users.findFirst({
        where: eq(users.uid, user.uid),
      }),
    ]);

    if (!challenge) throw new ApiError(404, "Challenge not found.");

    if (challenge.status !== "open" && challenge.status !== "active") {
      throw new ApiError(400, "This challenge is not accepting submissions.");
    }
    if (Date.now() > challenge.deadline) {
      throw new ApiError(400, "The deadline for this challenge has passed.");
    }

    const displayName = userRecord?.displayName ?? "Member";
    const now = Date.now();
    const submissionId = `${body.challengeId}_${user.uid}`;

    const historyItem = {
      at: now,
      action: existing ? "updated" : "submitted",
      by: user.uid,
      note: null,
    };

    if (existing) {
      if (existing.status === "approved") {
        throw new ApiError(400, "Approved submissions can no longer be edited.");
      }

      let history: any[] = [];
      try {
        history = JSON.parse(existing.history ?? "[]");
      } catch {}
      history.push(historyItem);

      await db
        .update(challengeSubmissions)
        .set({
          fileUrl: body.fileUrl ?? null,
          filePath: body.filePath ?? null,
          link: body.link ?? null,
          notes: body.notes ?? null,
          status: "pending",
          feedback: null,
          displayName,
          updatedAt: now,
          history: JSON.stringify(history),
        })
        .where(eq(challengeSubmissions.id, submissionId));
    } else {
      await db.insert(challengeSubmissions).values({
        id: submissionId,
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
        submittedAt: now,
        updatedAt: now,
        history: JSON.stringify([historyItem]),
      });
    }

    return jsonOk({ id: submissionId, status: "pending" });
  });
}

