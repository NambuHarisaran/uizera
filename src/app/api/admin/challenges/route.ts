import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challenges } from "@/lib/db/schema";
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

/** GET /api/admin/challenges — all challenges including drafts from Cloudflare D1. */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();
    const rows = await db.query.challenges.findMany({
      orderBy: [desc(challenges.week)],
      limit: 200,
    });

    const formatted = rows.map((c) => {
      let resources: any = [];
      try {
        resources = JSON.parse(c.resources ?? "[]");
      } catch {}
      return {
        ...c,
        resources,
        deadline: new Date(c.deadline),
        createdAt: new Date(c.createdAt),
      };
    });

    return jsonOk({ challenges: formatted });
  });
}

/** POST /api/admin/challenges — create a weekly challenge in Cloudflare D1. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const input = await parseBody(req, challengeUpsertSchema);

    const now = Date.now();
    const challengeId = `ch_${now}_${Math.random().toString(36).slice(2, 8)}`;

    await db.insert(challenges).values({
      id: challengeId,
      title: input.title,
      week: input.week,
      description: input.description ?? "",
      instructions: input.instructions ?? "",
      resources: JSON.stringify(input.resources ?? []),
      coins: input.coins,
      xp: input.xp ?? 50,
      status: input.status,
      deadline: input.deadline,
      createdBy: admin.uid,
      createdAt: now,
    });


    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "challenge.create",
      target: challengeId,
      details: { title: input.title, week: input.week },
    });

    return jsonOk({ id: challengeId });
  });
}

