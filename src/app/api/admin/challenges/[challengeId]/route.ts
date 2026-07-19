import { NextRequest } from "next/server";
import { adminDb, Timestamp } from "@/lib/firebase/admin";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { challengeUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { challengeId } = await params;
    const input = await parseBody(req, challengeUpsertSchema);

    const ref = adminDb().collection("challenges").doc(challengeId);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "Challenge not found.");

    await ref.update({
      ...input,
      deadline: Timestamp.fromMillis(input.deadline),
    });

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "challenge.update",
      target: challengeId,
      details: { title: input.title, status: input.status },
    });

    return jsonOk({ id: challengeId });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { challengeId } = await params;

    const ref = adminDb().collection("challenges").doc(challengeId);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "Challenge not found.");

    await ref.delete();

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "challenge.delete",
      target: challengeId,
      details: { title: snap.data()?.title },
    });

    return jsonOk({ deleted: true });
  });
}
