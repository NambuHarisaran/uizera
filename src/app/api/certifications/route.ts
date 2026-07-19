import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/certifications — list cert program days + user progress.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();

    const [daysSnap, progressSnap] = await Promise.all([
      adminDb()
        .collection("certProgram")
        .orderBy("day", "asc")
        .limit(30)
        .get(),
      adminDb().collection("certProgress").doc(user.uid).get(),
    ]);

    return jsonOk({
      days: daysSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      progress: progressSnap.exists
        ? { uid: progressSnap.id, ...progressSnap.data() }
        : null,
    });
  });
}
