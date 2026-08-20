import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challengeSubmissions } from "@/lib/db/schema";
import { handleApi, jsonOk, requireAdmin } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/submissions?challengeId=<id>&status=<status>
 * List challenge submissions for administrative review.
 */
export async function GET(req: NextRequest) {
  return handleApi(async () => {
    await requireAdmin();

    const url = req.nextUrl;
    const challengeId = url.searchParams.get("challengeId");
    const status = url.searchParams.get("status");

    const conditions = [];
    if (challengeId) conditions.push(eq(challengeSubmissions.challengeId, challengeId));
    if (status) conditions.push(eq(challengeSubmissions.status, status));

    const rows = await db.query.challengeSubmissions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(challengeSubmissions.submittedAt)],
      limit: 200,
    });

    const submissions = rows.map((r) => {
      let history: any[] = [];
      try {
        history = JSON.parse(r.history ?? "[]");
      } catch {}
      return {
        id: r.id,
        challengeId: r.challengeId,
        challengeTitle: r.challengeTitle,
        uid: r.uid,
        displayName: r.displayName,
        fileUrl: r.fileUrl ?? undefined,
        filePath: r.filePath ?? undefined,
        link: r.link ?? undefined,
        notes: r.notes ?? undefined,
        status: r.status,
        feedback: r.feedback ?? undefined,
        coinsAwarded: r.coinsAwarded,
        reviewedBy: r.reviewedBy ?? undefined,
        submittedAt: r.submittedAt ? new Date(r.submittedAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        history,
      };
    });

    return jsonOk({ submissions });
  });
}
