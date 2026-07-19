import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { handleApi, jsonOk, requireAdmin } from "@/lib/server/api";

export const runtime = "nodejs";

/**
 * GET /api/admin/users?q=<prefix>&limit=<n>
 * Search members by email or display-name prefix (admin only).
 */
export async function GET(req: NextRequest) {
  return handleApi(async () => {
    await requireAdmin();

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50, 1),
      200
    );

    const users = adminDb().collection("users");
    let docs;

    if (q) {
      const lower = q.toLowerCase();
      const [byEmail, byName] = await Promise.all([
        users
          .where("email", ">=", lower)
          .where("email", "<=", `${lower}`)
          .limit(limit)
          .get(),
        users
          .where("displayName", ">=", q)
          .where("displayName", "<=", `${q}`)
          .limit(limit)
          .get(),
      ]);
      const map = new Map(
        [...byEmail.docs, ...byName.docs].map((d) => [d.id, d])
      );
      docs = [...map.values()];
    } else {
      const snap = await users.orderBy("createdAt", "desc").limit(limit).get();
      docs = snap.docs;
    }

    return jsonOk({
      users: docs.map((d) => ({ ...d.data(), uid: d.id })),
    });
  });
}
