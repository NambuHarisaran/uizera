import "server-only";

import { adminDb, FieldValue } from "@/lib/firebase/admin";

/**
 * Append an entry to the immutable audit log. Never throws — an audit failure
 * must not break the user-facing operation, but it is loudly logged.
 */
export async function audit(entry: {
  actorUid: string;
  actorEmail: string;
  action: string;
  target: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await adminDb()
      .collection("auditLogs")
      .add({
        ...entry,
        details: Object.fromEntries(
          Object.entries(entry.details ?? {}).filter(([, v]) => v !== undefined)
        ),
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (err) {
    console.error("[audit] failed to write audit log:", entry.action, err);
  }
}
