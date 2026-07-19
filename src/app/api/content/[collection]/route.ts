import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk } from "@/lib/server/api";

export const runtime = "nodejs";

const PUBLIC_COLLECTIONS = new Set([
  "events",
  "resources",
  "announcements",
  "gallery",
  "team",
]);

/**
 * GET /api/content/[collection] — public read for published content.
 * Includes graceful fallback if composite indexes are building in Firestore.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  return handleApi(async () => {
    const { collection } = await params;

    if (!PUBLIC_COLLECTIONS.has(collection)) {
      return jsonOk({ items: [] });
    }

    const db = adminDb();
    let docs;

    try {
      let query = db.collection(collection).limit(500);

      // Filter by published for content that has the field
      if (collection === "events" || collection === "resources" || collection === "announcements") {
        query = query.where("published", "==", true);
      }

      // Order by appropriate field
      if (collection === "events") {
        query = query.orderBy("date", "desc");
      } else if (collection === "announcements") {
        query = query.orderBy("publishedAt", "desc");
      } else if (collection === "gallery" || collection === "team") {
        query = query.orderBy("order", "asc");
      } else {
        query = query.orderBy("createdAt", "desc");
      }

      const snap = await query.get();
      docs = snap.docs;
    } catch (err: any) {
      if (err?.code === 9 || String(err).includes("FAILED_PRECONDITION")) {
        // Fallback: fetch without where/orderBy composite requirement and sort in-memory
        const snap = await db.collection(collection).limit(500).get();
        docs = snap.docs;
        if (collection === "events" || collection === "resources" || collection === "announcements") {
          docs = docs.filter((d) => d.data().published === true);
        }
      } else {
        throw err;
      }
    }

    const items = docs.map((d) => ({ id: d.id, ...d.data() }));

    return jsonOk({ items });
  });
}
