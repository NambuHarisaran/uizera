import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { profileUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/profile — update the caller's own profile.
 * Schema-limited to cosmetic fields; role, coins, badges, and counters are
 * structurally unreachable from here.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`profile:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await parseBody(req, profileUpdateSchema);

    const updates: Record<string, unknown> = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.department !== undefined) updates.department = body.department;
    if (body.year !== undefined) updates.year = body.year;
    if (body.regNo !== undefined) updates.regNo = body.regNo;
    if (body.bio !== undefined) updates.bio = body.bio;

    if (Object.keys(updates).length === 0) {
      return jsonOk({ updated: false });
    }

    await adminDb().collection("users").doc(user.uid).update(updates);
    return jsonOk({ updated: true });
  });
}
