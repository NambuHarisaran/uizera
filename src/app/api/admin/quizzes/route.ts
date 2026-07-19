import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { buildQuizDocs } from "@/lib/server/quiz";
import { quizUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** GET /api/admin/quizzes — full list including drafts (admin only). */
export async function GET() {
  return handleApi(async () => {
    await requireAdmin();
    const snap = await adminDb()
      .collection("quizzes")
      .orderBy("startAt", "desc")
      .limit(200)
      .get();
    return jsonOk({
      quizzes: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  });
}

/** POST /api/admin/quizzes — create quiz + questions + private answer key. */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const input = await parseBody(req, quizUpsertSchema);

    const db = adminDb();
    const quizRef = db.collection("quizzes").doc();
    const { quizDoc, questions } = buildQuizDocs(input);

    const batch = db.batch();
    batch.set(quizRef, {
      ...quizDoc,
      createdBy: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    const answers: Record<string, unknown> = {};
    for (const q of questions) {
      batch.set(quizRef.collection("questions").doc(q.id), q.publicDoc);
      answers[q.id] = q.keyEntry;
    }
    batch.set(quizRef.collection("answerKey").doc("main"), { answers });
    await batch.commit();

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "quiz.create",
      target: quizRef.id,
      details: { title: input.title, questions: input.questions.length },
    });

    return jsonOk({ id: quizRef.id });
  });
}
