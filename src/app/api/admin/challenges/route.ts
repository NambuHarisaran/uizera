import { NextRequest } from "next/server";
import { adminDb, FieldValue, Timestamp } from "@/lib/firebase/admin";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { challengeUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** GET /api/admin/challenges — all challenges including drafts. */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();
    const snap = await adminDb()
      .collection("challenges")
      .orderBy("week", "desc")
      .limit(200)
      .get();
    return jsonOk({ challenges: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  });
}

/** POST /api/admin/challenges — create a weekly challenge. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const input = await parseBody(req, challengeUpsertSchema);

    const ref = await adminDb()
      .collection("challenges")
      .add({
        ...input,
        deadline: Timestamp.fromMillis(input.deadline),
        createdBy: admin.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "challenge.create",
      target: ref.id,
      details: { title: input.title, week: input.week },
    });

    return jsonOk({ id: ref.id });
  });
}
