import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgram, certProgress } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { handleApi, jsonOk } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/certifications — list cert program days + user progress from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await getSessionUser();

    const [daysRows, progressRows] = await Promise.all([
      db.query.certProgram.findMany({
        orderBy: [asc(certProgram.dayNumber)],
        limit: 30,
      }),
      user
        ? db.query.certProgress.findMany({
            where: eq(certProgress.uid, user.uid),
          })
        : Promise.resolve([]),
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
        link: d.resourceUrl || d.videoUrl || "#",
        videoUrl: d.videoUrl,
        resourceUrl: d.resourceUrl,
        xp: d.xp,
        coins: d.coins,
      })),
      progress: user
        ? {
            uid: user.uid,
            days: progressMap,
          }
        : null,
    });
  });
}


