import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { announcements, communityEvents, learningResources, teamMembers, gallery } from "@/lib/db/schema";
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

function resolveCollection(name: string): ContentCollection {
  if (!(name in CONTENT_SCHEMAS)) {
    throw new ApiError(404, "Unknown content collection.");
  }
  return name as ContentCollection;
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
    const data = (await parseBody(req, z.object({ data: schema }))).data as any;
    const now = Date.now();
    const docId = `cnt_${now}_${Math.random().toString(36).slice(2, 8)}`;

    if (collection === "events") {
      await db.insert(communityEvents).values({
        id: docId,
        title: data.title,
        description: data.description ?? "",
        date: data.date,
        time: data.time ?? "",
        venue: data.venue ?? "",
        image: data.image ?? null,
        registrationLink: data.registrationLink ?? null,
        speakers: JSON.stringify(data.speakers ?? []),
        published: Boolean(data.published),
        createdAt: now,
      });
    } else if (collection === "resources") {
      await db.insert(learningResources).values({
        id: docId,
        title: data.title,
        description: data.description ?? "",
        category: data.category,
        url: data.url,
        tags: JSON.stringify(data.tags ?? []),
        published: Boolean(data.published),
        createdAt: now,
      });
    } else if (collection === "announcements") {
      await db.insert(announcements).values({
        id: docId,
        title: data.title,
        body: data.body,
        priority: data.priority ?? "normal",
        pinned: Boolean(data.pinned),
        published: Boolean(data.published),
        publishedAt: data.published ? now : 0,
        createdBy: admin.uid,
      });
    } else if (collection === "team") {
      await db.insert(teamMembers).values({
        id: docId,
        name: data.name,
        role: data.role,
        section: data.section ?? "members",
        department: data.department ?? null,
        photo: data.photo ?? null,
        linkedin: data.linkedin ?? null,
        email: data.email ?? null,
        bio: data.bio ?? null,
        orderIndex: data.order ?? 0,
      });
    } else if (collection === "gallery") {
      await db.insert(gallery).values({
        id: docId,
        title: data.caption || "UiZera Gallery",
        imageUrl: data.image || "",
        category: data.event ?? null,
        eventDate: null,
        uploadedBy: admin.uid,
        createdAt: now,
      });
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `${collection}.create`,
      target: docId,
    });

    return jsonOk({ id: docId });
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
    const data = body.data as any;
    const now = Date.now();

    if (collection === "events") {
      await db
        .update(communityEvents)
        .set({
          title: data.title,
          description: data.description ?? "",
          date: data.date,
          time: data.time ?? "",
          venue: data.venue ?? "",
          image: data.image ?? null,
          registrationLink: data.registrationLink ?? null,
          speakers: JSON.stringify(data.speakers ?? []),
          published: Boolean(data.published),
        })
        .where(eq(communityEvents.id, body.id));
    } else if (collection === "resources") {
      await db
        .update(learningResources)
        .set({
          title: data.title,
          description: data.description ?? "",
          category: data.category,
          url: data.url,
          tags: JSON.stringify(data.tags ?? []),
          published: Boolean(data.published),
        })
        .where(eq(learningResources.id, body.id));
    } else if (collection === "announcements") {
      await db
        .update(announcements)
        .set({
          title: data.title,
          body: data.body,
          priority: data.priority ?? "normal",
          pinned: Boolean(data.pinned),
          published: Boolean(data.published),
          publishedAt: data.published ? now : 0,
        })
        .where(eq(announcements.id, body.id));
    } else if (collection === "team") {
      await db
        .update(teamMembers)
        .set({
          name: data.name,
          role: data.role,
          section: data.section ?? "members",
          department: data.department ?? null,
          photo: data.photo ?? null,
          linkedin: data.linkedin ?? null,
          email: data.email ?? null,
          bio: data.bio ?? null,
          orderIndex: data.order ?? 0,
        })
        .where(eq(teamMembers.id, body.id));
    } else if (collection === "gallery") {
      await db
        .update(gallery)
        .set({
          title: data.caption || "UiZera Gallery",
          imageUrl: data.image || "",
          category: data.event ?? null,
        })
        .where(eq(gallery.id, body.id));
    }

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

    let docId = req.nextUrl.searchParams.get("id");
    if (!docId) {
      try {
        const body = await req.json();
        docId = body?.id;
      } catch {}
    }

    if (!docId || typeof docId !== "string") {
      throw new ApiError(400, "Missing required 'id' parameter.");
    }

    if (collection === "events") {
      await db.delete(communityEvents).where(eq(communityEvents.id, docId));
    } else if (collection === "resources") {
      await db.delete(learningResources).where(eq(learningResources.id, docId));
    } else if (collection === "announcements") {
      await db.delete(announcements).where(eq(announcements.id, docId));
    } else if (collection === "team") {
      await db.delete(teamMembers).where(eq(teamMembers.id, docId));
    } else if (collection === "gallery") {
      await db.delete(gallery).where(eq(gallery.id, docId));
    }

    await audit({
      actorUid: admin.uid,
      actorEmail: admin.email,
      action: `${collection}.delete`,
      target: docId,
    });

    return jsonOk({ deleted: true });
  });
}


