import { NextRequest } from "next/server";
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
import { rateLimit } from "@/lib/server/rate-limit";
import { coinAwardSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/coins/award
 *
 * Manual coin grants for course completions, weekly tasks, special activities,
 * and community contributions. Admins can never award themselves; negative
 * adjustments are super-admin territory via source=admin_adjustment.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    rateLimit(`coin-award:${admin.uid}`, { limit: 30, windowMs: 60_000 });

    const body = await parseBody(req, coinAwardSchema);

    if (body.uid === admin.uid) {
      throw new ApiError(400, "You cannot award coins to yourself.");
    }
    if (body.amount < 0 && admin.role !== "super_admin") {
      throw new ApiError(403, "Only super admins can deduct coins.");
    }

    const result = await awardCoins({
      uid: body.uid,
      amount: body.amount,
      source: body.amount < 0 ? "admin_adjustment" : body.source,
      reason: body.reason,
      refId: null,
      awardedBy: admin.uid,
    });

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "coins.award",
      target: body.uid,
      details: { amount: body.amount, source: body.source, reason: body.reason },
    });

    return jsonOk(result);
  });
}
