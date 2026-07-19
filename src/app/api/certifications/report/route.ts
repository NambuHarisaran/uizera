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
import { certReportSchema } from "@/lib/validation";
import { toMillis } from "@/lib/utils";
import type { CertDay } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/certifications/report
 * Student reports a certification day as done. This only marks it "reported" —
 * coins and completion status are granted exclusively by admin verification.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`cert-report:${user.uid}`, { limit: 20, windowMs: 60_000 });

    const { dayId } = await parseBody(req, certReportSchema);

    const db = adminDb();
    const daySnap = await db.collection("certProgram").doc(dayId).get();
    if (!daySnap.exists) throw new ApiError(404, "Certification day not found.");
    const day = daySnap.data() as CertDay;

    if (Date.now() < toMillis(day.unlockDate)) {
      throw new ApiError(400, "This day is still locked.");
    }

    const progressRef = db.collection("certProgress").doc(user.uid);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(progressRef);
      const days =
        (snap.data()?.days as Record<string, { status: string }> | undefined) ??
        {};

      if (days[dayId]?.status === "completed") {
        throw new ApiError(400, "This day is already verified as completed.");
      }

      tx.set(
        progressRef,
        {
          uid: user.uid,
          days: {
            ...days,
            [dayId]: {
              ...(days[dayId] ?? {}),
              status: "reported",
              reportedAt: new Date(),
            },
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return jsonOk({ dayId, status: "reported" });
  });
}
