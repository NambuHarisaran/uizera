import "server-only";

import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

/**
 * Append an entry to the immutable audit log in Cloudflare D1. Never throws.
 */
export async function audit(entry: {
  actorUid: string;
  actorEmail: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const now = Date.now();
    const id = `audit_${now}_${Math.random().toString(36).slice(2, 9)}`;

    await db.insert(auditLogs).values({
      id,
      actorUid: entry.actorUid,
      actorEmail: entry.actorEmail,
      action: entry.action,
      target: entry.target ?? null,
      details: JSON.stringify(entry.details ?? {}),
      createdAt: now,
    });
  } catch (err) {
    console.error("[audit] failed to write audit log:", entry.action, err);
  }
}

