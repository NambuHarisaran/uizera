import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgram, certProgress } from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/certifications — list cert program days + user progress from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();

    const [daysRows, progressRows] = await Promise.all([
      db.query.certProgram.findMany({
        orderBy: [asc(certProgram.dayNumber)],
        limit: 30,
      }),
      db.query.certProgress.findMany({
        where: eq(certProgress.uid, user.uid),
      }),
    ]);

    const progressMap: Record<string, { status: string; completed: boolean; completedAt: number | null }> = {};
    for (const p of progressRows) {
      progressMap[p.dayId] = {
        status: p.completed ? "completed" : "reported",
        completed: Boolean(p.completed),
        completedAt: p.completedAt,
      };
    }

    return jsonOk({
      days: daysRows.map((d) => ({
        id: d.dayId,
        day: d.dayNumber,
        title: d.title,
        certName: d.title,
        description: d.description,
        videoUrl: d.videoUrl,
        resourceUrl: d.resourceUrl,
        xp: d.xp,
        coins: d.coins,
      })),
      progress: {
        uid: user.uid,
        days: progressMap,
      },
    });
  });
}

