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
import { userStatusSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** POST /api/admin/users/[uid]/status — disable or re-enable an account. */
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

    const userRef = adminDb().collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) throw new ApiError(404, "User not found.");
    if (snap.data()?.role === "super_admin") {
      throw new ApiError(400, "Super admins cannot be disabled here.");
    }

    await userRef.update({ disabled });
    await adminAuth().updateUser(uid, { disabled });
    if (disabled) await adminAuth().revokeRefreshTokens(uid);

    await audit({
      actorUid: actor.uid,
      actorEmail: actor.email,
      action: disabled ? "user.disable" : "user.enable",
      target: uid,
      details: { email: snap.data()?.email },
    });

    return jsonOk({ uid, disabled });
  });
}
