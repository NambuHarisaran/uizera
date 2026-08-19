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
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { certReportSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/certifications/report
 * Student reports a certification day as done in Cloudflare D1.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`cert-report:${user.uid}`, { limit: 20, windowMs: 60_000 });

    const { dayId } = await parseBody(req, certReportSchema);

    const [day, existingProgress] = await Promise.all([
      db.query.certProgram.findFirst({
        where: eq(certProgram.dayId, dayId),
      }),
      db.query.certProgress.findFirst({
        where: and(
          eq(certProgress.uid, user.uid),
          eq(certProgress.dayId, dayId)
        ),
      }),
    ]);

    if (!day) throw new ApiError(404, "Certification day not found.");

    if (existingProgress && existingProgress.completed) {
      throw new ApiError(400, "This day is already verified as completed.");
    }

    const now = Date.now();
    if (existingProgress) {
      await db
        .update(certProgress)
        .set({
          completed: false,
        })
        .where(
          and(
            eq(certProgress.uid, user.uid),
            eq(certProgress.dayId, dayId)
          )
        );
    } else {
      await db.insert(certProgress).values({
        uid: user.uid,
        dayId,
        completed: false,
        completedAt: null,
      });
    }

    return jsonOk({ dayId, status: "reported" });
  });
}

