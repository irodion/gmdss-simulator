import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index.ts";

export function createClient(url: string) {
  const sql = postgres(url);
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type Database = ReturnType<typeof createClient>["db"];
