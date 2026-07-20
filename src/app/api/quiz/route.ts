import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/quiz — list published quizzes (scheduled | live | closed).
 * Public to signed-in users.
 *
 * Live-session (instructor-led) quizzes never appear here, launched or not —
 * they're only reachable via the Live Stage link/QR the instructor shares,
 * so a premade session's questions can't be browsed ahead of time.
 */
export async function GET() {
  return handleApi(async () => {
    const snap = await adminDb()
      .collection("quizzes")
      .where("status", "in", ["scheduled", "live", "closed"])
      .orderBy("startAt", "desc")
      .limit(100)
      .get();

    const quizzes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((q: any) => q.mode !== "live");
    return jsonOk({ quizzes });
  });
}
