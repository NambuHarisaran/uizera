import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { challenges, challengeSubmissions } from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/challenges — list open/closed challenges + user submissions from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();

    const [challengeRows, submissionRows] = await Promise.all([
      db.query.challenges.findMany({
        where: inArray(challenges.status, ["open", "closed", "active"]),
        orderBy: [desc(challenges.deadline)],
        limit: 100,
      }),
      db.query.challengeSubmissions.findMany({
        where: eq(challengeSubmissions.uid, user.uid),
        orderBy: [desc(challengeSubmissions.submittedAt)],
        limit: 200,
      }),
    ]);

    const formattedChallenges = challengeRows.map((c) => {
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

    const formattedSubmissions = submissionRows.map((s) => {
      let history: any = [];
      try {
        history = JSON.parse(s.history ?? "[]");
      } catch {}
      return {
        ...s,
        history,
        submittedAt: new Date(s.submittedAt),
        updatedAt: new Date(s.updatedAt),
      };
    });

    return jsonOk({
      challenges: formattedChallenges,
      submissions: formattedSubmissions,
    });
  });
}

