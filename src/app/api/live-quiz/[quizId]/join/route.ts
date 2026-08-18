import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import { assertSameOrigin, handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * POST /api/live-quiz/[quizId]/join
 *
 * Registers the participant into the live quiz lobby so their avatar
 * appears on the big screen in real-time. Checks if they have been kicked.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;

    const db = adminDb();
    const sessionRef = db.collection("liveQuizSessions").doc(quizId);
    const participantRef = sessionRef.collection("participants").doc(user.uid);

    const profileSnap = await db.collection("users").doc(user.uid).get();
    const profile = profileSnap.data();
    const displayName = (profile?.displayName as string) || user.email?.split("@")[0] || "Participant";
    const photoURL = (profile?.photoURL as string) || null;

    const participantSnap = await participantRef.get();
    if (participantSnap.exists && participantSnap.data()?.kicked) {
      return jsonOk({ kicked: true });
    }

    await participantRef.set(
      {
        uid: user.uid,
        displayName,
        photoURL,
        joinedAt: participantSnap.exists
          ? participantSnap.data()?.joinedAt || FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
        lastSeenAt: FieldValue.serverTimestamp(),
        kicked: false,
      },
      { merge: true }
    );

    return jsonOk({ kicked: false });
  });
}
