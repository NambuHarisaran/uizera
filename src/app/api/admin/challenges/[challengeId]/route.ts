import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challenges, challengeSubmissions } from "@/lib/db/schema";
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

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });
    if (!challenge) throw new ApiError(404, "Challenge not found.");

    await db
      .update(challenges)
      .set({
        title: input.title,
        week: input.week,
        description: input.description,
        instructions: input.instructions,
        resources: JSON.stringify(input.resources ?? []),
        coins: input.coins,
        xp: input.xp ?? 50,
        status: input.status,
        deadline: input.deadline,
      })
      .where(eq(challenges.id, challengeId));

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

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    });
    if (!challenge) throw new ApiError(404, "Challenge not found.");

    await db.delete(challengeSubmissions).where(eq(challengeSubmissions.challengeId, challengeId));
    await db.delete(challenges).where(eq(challenges.id, challengeId));

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "challenge.delete",
      target: challengeId,
      details: { title: challenge.title },
    });

    return jsonOk({ deleted: true });
  });
}

