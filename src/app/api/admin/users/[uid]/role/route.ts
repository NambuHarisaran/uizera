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
import { roleUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/admin/users/[uid]/role — promote/demote user in Cloudflare D1.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const actor = await requireSuperAdmin();
    const { uid } = await params;
    const { role } = await parseBody(req, roleUpdateSchema);

    if (uid === actor.uid) {
      throw new ApiError(400, "You cannot change your own role.");
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.uid, uid),
    });
    if (!userRecord) throw new ApiError(404, "User not found.");
    if (userRecord.role === "super_admin") {
      throw new ApiError(400, "Super admins are managed via the environment allowlist.");
    }

    await db.update(users).set({ role }).where(eq(users.uid, uid));

    try {
      await adminAuth().setCustomUserClaims(uid, { role });
      await adminAuth().revokeRefreshTokens(uid);
    } catch {}

    await audit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: "user.role_change",
      target: uid,
      details: { newRole: role, email: userRecord.email },
    });

    return jsonOk({ uid, role });
  });
}

