import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgram } from "@/lib/db/schema";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { certDayUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

const bodySchema = z.union([
  z.object({
    days: z.array(certDayUpsertSchema).min(1).max(30),
  }),
  certDayUpsertSchema,
  z.array(certDayUpsertSchema).min(1).max(30),
]);

type CertDayInput = z.infer<typeof certDayUpsertSchema>;

/** POST /api/admin/certifications/days — upsert program-day definitions in Cloudflare D1. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const parsed = await parseBody(req, bodySchema);
    const rawList: (z.input<typeof certDayUpsertSchema>)[] = Array.isArray(parsed)
      ? parsed
      : "days" in parsed && Array.isArray(parsed.days)
      ? parsed.days
      : [parsed as any];

    const now = Date.now();

    for (const d of rawList) {
      const dayId = `day-${String(d.day).padStart(2, "0")}`;


      const existing = await db.query.certProgram.findFirst({
        where: eq(certProgram.dayId, dayId),
      });

      if (existing) {
        await db
          .update(certProgram)
          .set({
            dayNumber: d.day,
            title: d.certName,
            description: d.description ?? "",
            resourceUrl: d.link ?? null,
            coins: d.coins,
          })
          .where(eq(certProgram.dayId, dayId));
      } else {
        await db.insert(certProgram).values({
          dayId,
          dayNumber: d.day,
          title: d.certName,
          description: d.description ?? "",
          resourceUrl: d.link ?? null,
          coins: d.coins,
          xp: 10,
          createdAt: now,
        });
      }
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "cert.days.upsert",
      target: "certProgram",
      details: { count: rawList.length },
    });

    return jsonOk({ upserted: rawList.length });
  });
}


