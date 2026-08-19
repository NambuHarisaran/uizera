import { NextRequest } from "next/server";
import {
  assertSameOrigin,
  handleApi,
  jsonOk,
  parseBody,
} from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { audit } from "@/lib/server/audit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** POST /api/contact — public contact form (validated + rate limited). */
export async function POST(req: NextRequest) {
  return handleApi(async () => {
    assertSameOrigin(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
    rateLimit(`contact:${ip}`, { limit: 3, windowMs: 10 * 60_000 });

    const body = await parseBody(req, contactSchema);

    await audit({
      actorUid: "anonymous",
      actorEmail: body.email,
      action: "contact.message",
      target: body.name,
      details: {
        name: body.name,
        email: body.email,
        message: body.message,
      },
    });

    return jsonOk({ sent: true });
  });
}

