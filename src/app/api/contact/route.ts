import { NextRequest } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase/admin";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** POST /api/contact — public contact form (validated + rate limited). */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    rateLimit(`contact:${ip}`, { limit: 3, windowMs: 10 * 60_000 });

    const body = await parseBody(req, contactSchema);

    await adminDb().collection("contactMessages").add({
      name: body.name,
      email: body.email,
      message: body.message,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    });

    return jsonOk({ sent: true });
  });
}
