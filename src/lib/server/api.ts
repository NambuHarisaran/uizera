import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getSessionUser, isAdminRole, isHostRole, type SessionUser } from "@/lib/auth/session";

/** Thrown by guards; converted to a sanitized JSON response by `handleApi`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Wrap a route handler: catches ApiError and unexpected exceptions, never
 * leaking stack traces or internal error details to the client.
 */
export async function handleApi(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return jsonError(err.message, err.status);
    }
    if (err instanceof ZodError) {
      return jsonError("Invalid request data.", 400);
    }
    console.error("[api] unhandled error:", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** Auth guard: 401 when not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Sign in required.");
  return user;
}

/** Role guard: 403 unless admin or super_admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminRole(user.role)) throw new ApiError(403, "Admin access required.");
  return user;
}

/** Role guard: 403 unless super_admin. */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    throw new ApiError(403, "Super admin access required.");
  }
  return user;
}

/** Role guard: 403 unless quiz_host, admin, or super_admin. */
export async function requireQuizHost(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isHostRole(user.role)) throw new ApiError(403, "Quiz host access required.");
  return user;
}


/**
 * CSRF defense-in-depth: state-changing routes only accept requests whose
 * Origin (when present) matches our own host. Session cookie is SameSite=Lax,
 * so this is a second layer, not the only one.
 */
export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (no Origin) still need the session cookie
  const host = req.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new ApiError(403, "Cross-origin request rejected.");
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, "Invalid origin.");
  }
}

/** Parse + validate a JSON body against a zod schema. 400 on any mismatch. */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    throw new ApiError(400, `Invalid request data — ${detail}`);
  }
  return parsed.data;
}
