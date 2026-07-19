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
import { certVerifySchema } from "@/lib/validation";
import type { CertDay } from "@/types";

export const runtime = "nodejs";

interface DayEntry {
  status: string;
  coinGranted?: boolean;
  [k: string]: unknown;
}

/**
 * POST /api/admin/certifications/verify
 *
 * Bulk-verify certification completion for up to 200 students at once.
 * Coins for a given (student, day) pair are granted AT MOST ONCE, ever:
 * a permanent `coinGranted` flag survives status flips, so toggling
 * completed → pending → completed cannot farm duplicate rewards.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const body = await parseBody(req, certVerifySchema);

    const db = adminDb();
    const daySnap = await db.collection("certProgram").doc(body.dayId).get();
    if (!daySnap.exists) throw new ApiError(404, "Certification day not found.");
    const day = daySnap.data() as CertDay;

    const results: Array<{ uid: string; ok: boolean; error?: string }> = [];

    for (const uid of body.uids) {
      try {
        const progressRef = db.collection("certProgress").doc(uid);

        const { shouldAward } = await db.runTransaction(async (tx) => {
          const snap = await tx.get(progressRef);
          const days =
            (snap.data()?.days as Record<string, DayEntry> | undefined) ?? {};
          const entry = days[body.dayId] ?? { status: "pending" };

          if (body.status === "completed" && entry.status === "completed") {
            return { shouldAward: false };
          }

          const award =
            body.status === "completed" && entry.coinGranted !== true;

          const completedDelta =
            body.status === "completed" && entry.status !== "completed"
              ? 1
              : body.status === "pending" && entry.status === "completed"
                ? -1
                : 0;

          const prevCount = (snap.data()?.completedCount as number) ?? 0;

          tx.set(
            progressRef,
            {
              uid,
              days: {
                ...days,
                [body.dayId]: {
                  ...entry,
                  status: body.status,
                  verifiedBy: admin.uid,
                  verifiedAt: new Date(),
                  coinGranted: entry.coinGranted === true || award,
                },
              },
              completedCount: Math.max(0, prevCount + completedDelta),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          return { shouldAward: award };
        });

        if (shouldAward && day.coins > 0) {
          await awardCoins({
            uid,
            amount: day.coins,
            source: "certification",
            reason: `Certification verified: ${day.certName} (Day ${day.day})`,
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
