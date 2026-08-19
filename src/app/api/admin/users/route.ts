import { NextRequest } from "next/server";
import { desc, like, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { handleApi, jsonOk, requireAdmin } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/users?q=<search>&limit=<n>
 * Search members from Cloudflare D1 users table.
 */
export async function GET(req: NextRequest) {
  return handleApi(async () => {
    await requireAdmin();

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50, 1),
      200
    );

    let rows;
    if (q) {
      rows = await db.query.users.findMany({
        where: or(
          like(users.email, `%${q.toLowerCase()}%`),
          like(users.displayName, `%${q}%`)
        ),
        orderBy: [desc(users.createdAt)],
        limit,
      });
    } else {
      rows = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
        limit,
      });
    }

    const formatted = rows.map((u) => {
      let badges: string[] = [];
      try {
        badges = JSON.parse(u.badges ?? "[]");
      } catch {}
      return {
        ...u,
        badges,
        disabled: Boolean(u.disabled),
      };
    });

    return jsonOk({ users: formatted });
  });
}

