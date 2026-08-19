import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireUser,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { profileUpdateSchema } from "@/lib/validation";
import { getAppUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/profile — the caller's own full profile from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await getAppUser();
    if (!user) throw new ApiError(401, "Sign in required.");
    return jsonOk({ user });
  });
}

/**
 * POST /api/profile — update the caller's own profile in Cloudflare D1.
 */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    rateLimit(`profile:${user.uid}`, { limit: 10, windowMs: 60_000 });

    const body = await parseBody(req, profileUpdateSchema);

    const updates: Record<string, any> = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.department !== undefined) updates.department = body.department;
    if (body.year !== undefined) updates.year = body.year;
    if (body.regNo !== undefined) updates.regNo = body.regNo;
    if (body.bio !== undefined) updates.bio = body.bio;

    if (Object.keys(updates).length === 0) {
      return jsonOk({ updated: false });
    }

    await db.update(users).set(updates).where(eq(users.uid, user.uid));
    return jsonOk({ updated: true });
  });
}

