import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { liveQuizParticipants, users } from "@/lib/db/schema";
import { assertSameOrigin, handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * POST /api/live-quiz/[quizId]/join
 * Registers participant into Cloudflare D1 live_quiz_participants table.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const user = await requireUser();
    const { quizId } = await params;

    const [userRecord, existingParticipant] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.uid, user.uid) }),
      db.query.liveQuizParticipants.findFirst({
        where: and(
          eq(liveQuizParticipants.quizId, quizId),
          eq(liveQuizParticipants.uid, user.uid)
        ),
      }),
    ]);

    if (existingParticipant && existingParticipant.kicked) {
      return jsonOk({ kicked: true });
    }

    const displayName = userRecord?.displayName || user.email?.split("@")[0] || "Participant";
    const photoURL = userRecord?.photoURL || null;
    const now = Date.now();

    if (existingParticipant) {
      await db
        .update(liveQuizParticipants)
        .set({ displayName, photoURL, kicked: false })
        .where(
          and(
            eq(liveQuizParticipants.quizId, quizId),
            eq(liveQuizParticipants.uid, user.uid)
          )
        );
    } else {
      await db.insert(liveQuizParticipants).values({
        quizId,
        uid: user.uid,
        displayName,
        photoURL,
        kicked: false,
        joinedAt: now,
      });
    }

    return jsonOk({ kicked: false });
  });
}

