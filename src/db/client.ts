import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

/**
 * Single shared libSQL client. On Vercel this points at a Turso database over
 * HTTPS; locally it falls back to a `file:local.db` SQLite file so the app runs
 * with zero external setup.
 */
const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
export { schema };
