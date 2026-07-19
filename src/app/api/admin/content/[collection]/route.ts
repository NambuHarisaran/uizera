import { NextRequest } from "next/server";
import { z } from "zod";
import { adminDb, FieldValue, Timestamp } from "@/lib/firebase/admin";
import {
  ApiError,
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
  requireAdmin,
} from "@/lib/server/api";
import { audit } from "@/lib/server/audit";
import { CONTENT_SCHEMAS, type ContentCollection } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Generic admin CRUD for content collections. The collection name is checked
 * against a hard allowlist — this route can never touch users, coins,
 * quizzes, or any other privileged collection.
 */
function resolveCollection(name: string): ContentCollection {
  if (!(name in CONTENT_SCHEMAS)) {
    throw new ApiError(404, "Unknown content collection.");
  }
  return name as ContentCollection;
}

/** Convert millis fields to Firestore Timestamps for known date fields. */
function normalizeDates(
  collection: ContentCollection,
  data: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...data };
  if (collection === "events" && typeof out.date === "number") {
    out.date = Timestamp.fromMillis(out.date);
  }
  if (collection === "announcements" && out.published === true) {
    out.publishedAt = FieldValue.serverTimestamp();
  }
  return out;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { collection: raw } = await params;
    const collection = resolveCollection(raw);

    const schema = CONTENT_SCHEMAS[collection];
    const data = await parseBody(req, z.object({ data: schema })).then(
      (b) => b.data
    );

    const ref = await adminDb()
      .collection(collection)
      .add({
        ...normalizeDates(collection, data as Record<string, unknown>),
        createdBy: admin.uid,
        createdAt: FieldValue.serverTimestamp(),
      });

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `${collection}.create`,
      target: ref.id,
    });

    return jsonOk({ id: ref.id });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { collection: raw } = await params;
    const collection = resolveCollection(raw);

    const schema = CONTENT_SCHEMAS[collection];
    const body = await parseBody(
      req,
      z.object({ id: z.string().min(1).max(128), data: schema })
    );

    const ref = adminDb().collection(collection).doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "Document not found.");

    await ref.update(
      normalizeDates(collection, body.data as Record<string, unknown>)
    );

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `${collection}.update`,
      target: body.id,
    });

    return jsonOk({ id: body.id });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const admin = await requireAdmin();
    const { collection: raw } = await params;
    const collection = resolveCollection(raw);

    const body = await parseBody(req, z.object({ id: z.string().min(1).max(128) }));

    const ref = adminDb().collection(collection).doc(body.id);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "Document not found.");

    await ref.delete();

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `${collection}.delete`,
      target: body.id,
    });

    return jsonOk({ deleted: true });
  });
}
