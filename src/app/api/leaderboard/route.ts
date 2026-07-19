import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk } from "@/lib/server/api";
import type { LeaderboardPeriod } from "@/types";

export const runtime = "nodejs";

const SORT_FIELDS: Record<LeaderboardPeriod, string> = {
  overall: "coins",
  weekly: "weeklyCoins",
  monthly: "monthlyCoins",
};

/**
 * GET /api/leaderboard?period=overall|weekly|monthly
 * Public — returns the top 100 entries from the users collection.
 * Includes graceful fallback if composite indexes are building in Firestore.
 */
export async function GET(req: NextRequest) {
  return handleApi(async () => {
    const period = (req.nextUrl.searchParams.get("period") ?? "overall") as LeaderboardPeriod;
    const sortField = SORT_FIELDS[period] ?? "coins";

    let docs;
    try {
      // Indexed query
      const snap = await adminDb()
        .collection("users")
        .where("disabled", "==", false)
        .orderBy(sortField, "desc")
        .limit(100)
        .get();
      docs = snap.docs;
    } catch (err: any) {
      // Fallback if index is building or missing: fetch all active users & sort in memory
      if (err?.code === 9 || String(err).includes("FAILED_PRECONDITION")) {
        const snap = await adminDb().collection("users").limit(500).get();
        docs = snap.docs.filter((d) => d.data().disabled !== true);
        docs.sort((a, b) => (b.data()[sortField] ?? 0) - (a.data()[sortField] ?? 0));
        docs = docs.slice(0, 100);
      } else {
        throw err;
      }
    }

    const entries = docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        displayName: data.displayName ?? "Member",
        photoURL: data.photoURL ?? null,
        department: data.department ?? null,
        year: data.year ?? null,
        coins: data.coins ?? 0,
        weeklyCoins: data.weeklyCoins ?? 0,
        monthlyCoins: data.monthlyCoins ?? 0,
        xp: data.xp ?? 0,
        level: data.level ?? 1,
        badges: data.badges ?? [],
      };
    });

    return jsonOk({ entries });
  });
}
