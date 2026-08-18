import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi } from "@/lib/server/api";

export const runtime = "nodejs";

const PUBLIC_COLLECTIONS = new Set([
  "events",
  "resources",
  "announcements",
  "gallery",
  "team",
]);

/**
 * CDN cache TTLs per collection (seconds).
 * These are served from Vercel's edge network so Firestore is only hit once
 * per window per region, drastically reducing serverless function invocations
 * on the free tier.
 *
 * stale-while-revalidate lets the CDN serve stale content instantly while
 * refreshing in the background — zero latency for the visitor.
 */
const CACHE_TTL: Record<string, string> = {
  team:          "s-maxage=3600, stale-while-revalidate=300",   // 1hr / 5min SWR
  gallery:       "s-maxage=3600, stale-while-revalidate=300",   // 1hr / 5min SWR
  resources:     "s-maxage=600,  stale-while-revalidate=60",    // 10min / 1min SWR
  announcements: "s-maxage=120,  stale-while-revalidate=30",    // 2min / 30s SWR
  events:        "s-maxage=300,  stale-while-revalidate=60",    // 5min / 1min SWR
};

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
      return NextResponse.json({ ok: true, data: { items: [] } });
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
    const cacheHeader = CACHE_TTL[collection] ?? "s-maxage=60, stale-while-revalidate=30";

    return NextResponse.json(
      { ok: true, data: { items } },
      { headers: { "Cache-Control": cacheHeader } }
    );
  });
}
