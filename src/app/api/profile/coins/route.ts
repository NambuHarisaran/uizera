import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { coinTransactions } from "@/lib/db/schema";
import { handleApi, jsonOk, requireUser } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/profile/coins
 * Returns the current user's coin transaction history from Cloudflare D1.
 */
export async function GET() {
  return handleApi(async () => {
    const user = await requireUser();

    const rows = await db.query.coinTransactions.findMany({
      where: eq(coinTransactions.uid, user.uid),
      orderBy: [desc(coinTransactions.createdAt)],
      limit: 100,
    });

    return jsonOk({
      transactions: rows.map((r) => ({
        id: r.id,
        uid: r.uid,
        displayName: r.displayName,
        amount: r.amount,
        source: r.source,
        reason: r.reason,
        refId: r.refId ?? undefined,
        awardedBy: r.awardedBy,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      })),
    });
  });
}
