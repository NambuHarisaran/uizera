import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, Timestamp } from "@/lib/firebase/admin";
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

const bodySchema = z.object({
  days: z.array(certDayUpsertSchema).min(1).max(30),
});

/** POST /api/admin/certifications/days — upsert program-day definitions. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { days } = await parseBody(req, bodySchema);

    const db = adminDb();
    const batch = db.batch();
    for (const d of days) {
      const id = `day-${String(d.day).padStart(2, "0")}`;
      batch.set(
        db.collection("certProgram").doc(id),
        {
          day: d.day,
          certName: d.certName,
          description: d.description,
          link: d.link,
          coins: d.coins,
          unlockDate: Timestamp.fromMillis(d.unlockDate),
        },
        { merge: true }
      );
    }
    await batch.commit();

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "cert.days.upsert",
      target: "certProgram",
      details: { count: days.length },
    });

    return jsonOk({ upserted: days.length });
  });
}
