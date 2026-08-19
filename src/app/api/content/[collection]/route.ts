import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { announcements, communityEvents, learningResources, teamMembers, gallery } from "@/lib/db/schema";
import { handleApi } from "@/lib/server/api";

export const runtime = "nodejs";

const PUBLIC_COLLECTIONS = new Set([
  "events",
  "resources",
  "announcements",
  "gallery",
  "team",
]);

const CACHE_TTL: Record<string, string> = {
  team:          "s-maxage=3600, stale-while-revalidate=300",
  gallery:       "s-maxage=3600, stale-while-revalidate=300",
  resources:     "s-maxage=600,  stale-while-revalidate=60",
  announcements: "s-maxage=120,  stale-while-revalidate=30",
  events:        "s-maxage=300,  stale-while-revalidate=60",
};

/**
 * GET /api/content/[collection] — public read from Cloudflare D1.
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

    let items: any[] = [];

    if (collection === "events") {
      const rows = await db.query.communityEvents.findMany({
        where: eq(communityEvents.published, true),
        orderBy: [desc(communityEvents.date)],
        limit: 100,
      });
      items = rows.map((r) => {
        let speakers: any = [];
        try {
          speakers = JSON.parse(r.speakers ?? "[]");
        } catch {}
        return {
          ...r,
          speakers,
          date: new Date(r.date),
          createdAt: new Date(r.createdAt),
        };
      });
    } else if (collection === "resources") {
      const rows = await db.query.learningResources.findMany({
        where: eq(learningResources.published, true),
        orderBy: [desc(learningResources.createdAt)],
        limit: 200,
      });
      items = rows.map((r) => {
        let tags: any = [];
        try {
          tags = JSON.parse(r.tags ?? "[]");
        } catch {}
        return {
          ...r,
          tags,
          createdAt: new Date(r.createdAt),
        };
      });
    } else if (collection === "announcements") {
      const rows = await db.query.announcements.findMany({
        where: eq(announcements.published, true),
        orderBy: [desc(announcements.publishedAt)],
        limit: 50,
      });
      items = rows.map((r) => ({
        ...r,
        publishedAt: r.publishedAt ? new Date(r.publishedAt) : null,
      }));
    } else if (collection === "team") {
      const rows = await db.query.teamMembers.findMany({
        orderBy: [asc(teamMembers.orderIndex)],
        limit: 100,
      });
      items = rows.map((r) => ({
        ...r,
        order: r.orderIndex,
      }));
    } else if (collection === "gallery") {
      const rows = await db.query.gallery.findMany({
        orderBy: [desc(gallery.createdAt)],
        limit: 100,
      });
      items = rows.map((r) => ({
        ...r,
        image: r.imageUrl,
        caption: r.title,
        createdAt: new Date(r.createdAt),
      }));
    }


    const cacheHeader = CACHE_TTL[collection] ?? "s-maxage=60, stale-while-revalidate=30";

    return NextResponse.json(
      { ok: true, data: { items } },
      { headers: { "Cache-Control": cacheHeader } }
    );
  });
}

