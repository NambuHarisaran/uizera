import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { certProgress } from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();
    const progressRows = await db.query.certProgress.findMany({
      where: eq(certProgress.uid, user.uid),
    });

    const progressMap: Record<string, { status: string; completed: boolean; completedAt: number | null }> = {};
    for (const p of progressRows) {
      progressMap[p.dayId] = {
        status: p.completed ? "completed" : "reported",
        completed: Boolean(p.completed),
        completedAt: p.completedAt,
      };
    }

    return jsonOk({
      progress: {
        uid: user.uid,
        days: progressMap,
        completedCount: progressRows.filter((p) => p.completed).length,
      },
    });
  });
}
