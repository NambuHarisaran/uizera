import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
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
 * POST /api/admin/users/[uid]/role — promote/demote between admin and student.
 *
 * Super-admin only. Super-admin status itself can NEVER be granted here — it
 * comes exclusively from the SUPER_ADMIN_EMAILS environment allowlist, so a
 * compromised admin session cannot mint a super admin. Custom claims are
 * updated and refresh tokens revoked, forcing a fresh sign-in under the new
 * role (security rules read the claim).
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

    const userRef = adminDb().collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) throw new ApiError(404, "User not found.");
    if (snap.data()?.role === "super_admin") {
      throw new ApiError(400, "Super admins are managed via the environment allowlist.");
    }

    await userRef.update({ role });
    await adminAuth().setCustomUserClaims(uid, { role });
    // Force re-auth so the stale session/claims cannot linger.
    await adminAuth().revokeRefreshTokens(uid);

    await audit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: "user.role_change",
      target: uid,
      details: { newRole: role, email: snap.data()?.email },
    });

    return jsonOk({ uid, role });
  });
}
