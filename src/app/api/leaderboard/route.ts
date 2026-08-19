import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { handleApi, jsonOk } from "@/lib/server/api";
import type { LeaderboardPeriod } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/leaderboard?period=overall|weekly|monthly
 * Top 100 entries from Cloudflare D1 users table.
 */
export async function GET(req: NextRequest) {
  return handleApi(async () => {
    const period = (req.nextUrl.searchParams.get("period") ?? "overall") as LeaderboardPeriod;

    let orderByColumn: any = users.coins;
    if (period === "weekly") orderByColumn = users.weeklyCoins;
    if (period === "monthly") orderByColumn = users.monthlyCoins;

    const rows = await db.query.users.findMany({
      where: eq(users.disabled, false),
      orderBy: [desc(orderByColumn), desc(users.xp), desc(users.coins), desc(users.createdAt)],
      limit: 100,
    });



    const entries = rows.map((u) => {
      let badges: string[] = [];
      try {
        badges = JSON.parse(u.badges ?? "[]");
      } catch {}
      return {
        uid: u.uid,
        displayName: u.displayName ?? "Member",
        photoURL: u.photoURL ?? null,
        department: u.department ?? null,
        year: u.year ?? null,
        coins: u.coins ?? 0,
        weeklyCoins: u.weeklyCoins ?? 0,
        monthlyCoins: u.monthlyCoins ?? 0,
        xp: u.xp ?? 0,
        level: u.level ?? 1,
        badges,
      };
    });

    return jsonOk({ entries });
  });
}

