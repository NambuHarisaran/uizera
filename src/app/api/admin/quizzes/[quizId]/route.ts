import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import {
  ApiError,
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

/** GET — full quiz incl. questions + answer key for the editor (admin only). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    await requireAdmin();
    const { quizId } = await params;
    const db = adminDb();

    const quizSnap = await db.collection("quizzes").doc(quizId).get();
    if (!quizSnap.exists) throw new ApiError(404, "Quiz not found.");

    const [questionsSnap, keySnap] = await Promise.all([
      db.collection("quizzes").doc(quizId).collection("questions").orderBy("order").get(),
      db.collection("quizzes").doc(quizId).collection("answerKey").doc("main").get(),
    ]);

    const answers = (keySnap.data()?.answers ?? {}) as Record<
      string,
      { correct: number[]; explanation: string | null }
    >;

    const questions = questionsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      correctIndices: answers[d.id]?.correct ?? [],
      explanation: answers[d.id]?.explanation ?? null,
    }));

    return jsonOk({ quiz: { id: quizSnap.id, ...quizSnap.data() }, questions });
  });
}

/** PUT — replace quiz metadata, questions, and answer key. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;
    const input = await parseBody(req, quizUpsertSchema);

    const db = adminDb();
    const quizRef = db.collection("quizzes").doc(quizId);
    const quizSnap = await quizRef.get();
    if (!quizSnap.exists) throw new ApiError(404, "Quiz not found.");

    const existingQuestions = await quizRef.collection("questions").get();

    const { quizDoc, questions } = buildQuizDocs(input);
    const batch = db.batch();
    existingQuestions.docs.forEach((d) => batch.delete(d.ref));
    batch.update(quizRef, quizDoc);

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
      action: "quiz.update",
      target: quizId,
      details: { title: input.title, status: input.status },
    });

    return jsonOk({ id: quizId });
  });
}

/** DELETE — remove quiz, questions, and answer key. Attempts are kept. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { quizId } = await params;

    const db = adminDb();
    const quizRef = db.collection("quizzes").doc(quizId);
    const quizSnap = await quizRef.get();
    if (!quizSnap.exists) throw new ApiError(404, "Quiz not found.");

    const [questions, keys, counters] = await Promise.all([
      quizRef.collection("questions").get(),
      quizRef.collection("answerKey").get(),
      quizRef.collection("attemptCounters").get(),
    ]);

    const batch = db.batch();
    questions.docs.forEach((d) => batch.delete(d.ref));
    keys.docs.forEach((d) => batch.delete(d.ref));
    counters.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(quizRef);
    await batch.commit();

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: "quiz.delete",
      target: quizId,
      details: { title: quizSnap.data()?.title },
    });

    return jsonOk({ deleted: true });
  });
}
