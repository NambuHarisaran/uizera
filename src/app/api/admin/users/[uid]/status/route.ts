import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireSuperAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { userStatusSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** POST /api/admin/users/[uid]/status — disable or re-enable an account in Cloudflare D1. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const actor = await requireSuperAdmin();
    const { uid } = await params;
    const { disabled } = await parseBody(req, userStatusSchema);

    if (uid === actor.uid) {
      throw new ApiError(400, "You cannot disable your own account.");
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.uid, uid),
    });
    if (!userRecord) throw new ApiError(404, "User not found.");
    if (userRecord.role === "super_admin") {
      throw new ApiError(400, "Super admins cannot be disabled here.");
    }

    await db.update(users).set({ disabled }).where(eq(users.uid, uid));

    try {
      await adminAuth().updateUser(uid, { disabled });
      if (disabled) await adminAuth().revokeRefreshTokens(uid);
    } catch {}

    await audit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: disabled ? "user.disable" : "user.enable",
      target: uid,
      details: { email: userRecord.email },
    });

    return jsonOk({ uid, disabled });
  });
}

