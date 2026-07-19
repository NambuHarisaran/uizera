import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/challenges — list open/closed challenges + the user's submissions.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();

    const [challengeSnap, submissionSnap] = await Promise.all([
      adminDb()
        .collection("challenges")
        .where("status", "in", ["open", "closed"])
        .orderBy("deadline", "desc")
        .limit(100)
        .get(),
      adminDb()
        .collection("submissions")
        .where("uid", "==", user.uid)
        .orderBy("submittedAt", "desc")
        .limit(200)
        .get(),
    ]);

    return jsonOk({
      challenges: challengeSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      submissions: submissionSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  });
}
