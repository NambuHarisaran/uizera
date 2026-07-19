import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/quiz — list published quizzes (scheduled | live | closed).
 * Public to signed-in users.
 */
export async function GET() {
  return handleApi(async () => {
    const snap = await adminDb()
      .collection("quizzes")
      .where("status", "in", ["scheduled", "live", "closed"])
      .orderBy("startAt", "desc")
      .limit(100)
      .get();

    const quizzes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return jsonOk({ quizzes });
  });
}
