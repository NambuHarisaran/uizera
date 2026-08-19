import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgram, certProgress } from "@/lib/db/schema";
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
import { certVerifySchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/certifications/verify
 * Bulk-verify certification completion for students in Cloudflare D1.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await parseBody(req, certVerifySchema);

    const day = await db.query.certProgram.findFirst({
      where: eq(certProgram.dayId, body.dayId),
    });
    if (!day) throw new ApiError(404, "Certification day not found.");

    const results: Array<{ uid: string; ok: boolean; error?: string }> = [];
    const now = Date.now();

    for (const uid of body.uids) {
      try {
        const existingProgress = await db.query.certProgress.findFirst({
          where: and(
            eq(certProgress.uid, uid),
            eq(certProgress.dayId, body.dayId)
          ),
        });

        const isCompleted = body.status === "completed";
        const wasAlreadyCompleted = Boolean(existingProgress?.completed);
        const shouldAward = isCompleted && !wasAlreadyCompleted;

        if (existingProgress) {
          await db
            .update(certProgress)
            .set({
              completed: isCompleted,
              completedAt: isCompleted ? now : null,
              verifiedBy: admin.uid,
            })
            .where(
              and(
                eq(certProgress.uid, uid),
                eq(certProgress.dayId, body.dayId)
              )
            );
        } else {
          await db.insert(certProgress).values({
            uid,
            dayId: body.dayId,
            completed: isCompleted,
            completedAt: isCompleted ? now : null,
            verifiedBy: admin.uid,
          });
        }

        if (shouldAward && (day.coins > 0 || day.xp > 0)) {
          await awardCoins({
            uid,
            amount: day.coins,
            xpAmount: day.xp,
            source: "certification",
            reason: `Certification verified: ${day.title} (Day ${day.dayNumber})`,
            refId: body.dayId,
            awardedBy: admin.uid,
            counters: { certsCompleted: 1 },
          });
        }

        results.push({ uid, ok: true });
      } catch (err) {
        results.push({
          uid,
          ok: false,
          error: err instanceof Error ? err.message : "failed",
        });
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `cert.verify.${body.status}`,
      target: body.dayId,
      details: {
        students: body.uids.length,
        succeeded: results.filter((r) => r.ok).length,
      },
    });

    return jsonOk({ results });
  });
}

