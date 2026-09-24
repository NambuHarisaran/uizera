import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgram, certProgress, users } from "@/lib/db/schema";
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
 * GET /api/admin/certifications/verify
 * Lists all pending certification completion reports for teacher review.
 */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();
    // Query certProgress where completed = false
    const pendingList = await db.query.certProgress.findMany({
      where: eq(certProgress.completed, false),
    });

    if (pendingList.length === 0) {
      return jsonOk({ pending: [] });
    }

    const userUids = Array.from(new Set(pendingList.map((p) => p.uid)));
    const dayIds = Array.from(new Set(pendingList.map((p) => p.dayId)));

    const [userRecords, dayRecords] = await Promise.all([
      db.query.users.findMany({
        where: inArray(users.uid, userUids),
      }),
      db.query.certProgram.findMany({
        where: inArray(certProgram.dayId, dayIds),
      }),
    ]);

    const userMap = new Map(userRecords.map((u) => [u.uid, u]));
    const dayMap = new Map(dayRecords.map((d) => [d.dayId, d]));

    const pending = pendingList.map((p) => {
      const u = userMap.get(p.uid);
      const d = dayMap.get(p.dayId);
      return {
        uid: p.uid,
        dayId: p.dayId,
        dayNumber: d?.dayNumber ?? 0,
        dayTitle: d?.title ?? p.dayId,
        coins: d?.coins ?? 50,
        xp: d?.xp ?? 50,
        user: {
          displayName: u?.displayName || "Unknown Student",
          email: u?.email || "",
          photoURL: u?.photoURL,
          department: u?.department,
          year: u?.year,
          regNo: u?.regNo,
        },
        submissionLink: p.submissionLink || null,
        completedAt: p.completedAt,
      };
    });

    return jsonOk({ pending });
  });
}

/**
 * POST /api/admin/certifications/verify
 * Bulk-verify or reject certification completion for students in Cloudflare D1.
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
        if (body.status === "rejected") {
          // Remove pending progress so student can retry
          await db
            .delete(certProgress)
            .where(
              and(
                eq(certProgress.uid, uid),
                eq(certProgress.dayId, body.dayId)
              )
            );
          results.push({ uid, ok: true });
          continue;
        }

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

