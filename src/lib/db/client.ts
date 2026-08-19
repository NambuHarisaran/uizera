import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

async function queryD1(sql: string, params: any[], method: "run" | "all" | "values" | "get") {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Missing Cloudflare D1 environment variables. " +
      "Ensure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_D1_API_TOKEN are set."
    );
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params: params ?? [],
    }),
  });


  const body = (await res.json()) as any;
  if (!body.success) {
    const errorMsg = body.errors?.[0]?.message || "Cloudflare D1 query failed";
    throw new Error(`[D1 Error] ${errorMsg} (SQL: ${sql})`);
  }

  const rawResults = body.result?.[0]?.results ?? [];

  if (method === "get") {
    const first = rawResults[0];
    const rows = first ? Object.values(first) : undefined;
    return { rows: rows as any };
  }

  if (method === "all" || method === "values") {
    const rows = rawResults.map((r: any) => Object.values(r));
    return { rows };
  }

  return { rows: [] };
}

export const db = drizzle(
  async (sql, params, method) => {
    return queryD1(sql, params, method);
  },
  { schema }
);


export type DB = typeof db;

